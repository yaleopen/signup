package com.instructure.canvas

import grails.converters.JSON
import groovyx.gpars.GParsPool
import org.springframework.web.multipart.MultipartFile
import signup.tool.ApptGroupNotificationPreference
import signup.tool.NotificationPreference

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class AppointmentGroupsController {

    def appointmentGroupsService
    def courseService
    def usersService
    def calendarEventsService
    def groupsService
    def notificationService
    def fileService

    static responseFormats = ['json', 'html']

    def viewAppts() {
        String canvasUserId = session.userId
        String includePastAppts = params.includePastAppts ? params.includePastAppts : 'true'
        def managedAppts = appointmentGroupsService.listAppointmentGroups(canvasUserId, 'manageable', includePastAppts)
        def reservableAppts = appointmentGroupsService.listAppointmentGroups(canvasUserId, 'reservable', includePastAppts)
        reservableAppts.removeAll {
            managedAppts.id.contains(it.id) || signup.tool.AppointmentGroup.findByApptGroupIdAndPublished(it.id as String, false)
        }
        def sortedAppts = managedAppts + reservableAppts
        def locations = usersService.loadCustomData(canvasUserId, 'location')
        sortedAppts.sort{appt->
            appt.appointments.sort{it.start_at} ? appt.appointments.sort{it.start_at}.get(0).start_at : appt.start_at
        }
        List<String> allContextCodes = sortedAppts.context_codes.flatten().unique() as List<String>
        Map<String, Course> courses = [:]
        allContextCodes.each{contextCode ->
            def courseId = contextCode.split('_')[1]
            courses.put(courseId, courseService.getSingleCourse(courseId))
        }
        GParsPool.withPool(15) {
            final def collectedAppts = sortedAppts.collectParallel{appt ->
                def firstCourseId = appt.context_codes.get(0) ? appt.context_codes.get(0).split('_')[1] : null
                if(firstCourseId){
                    def attachments = fileService.listFiles(firstCourseId, appt.id as String)
                    if(attachments){
                        appt.existingAttachments = attachments
                    }
                }
                //add courses
                List<Course> apptCourses = []
                appt.context_codes.each{contextCode ->
                    apptCourses.add(courses.get(contextCode.split('_')[1]))
                }
                appt.courses = apptCourses
                //update published status
                signup.tool.AppointmentGroup.withTransaction {
                    appt.isPublished = signup.tool.AppointmentGroup.findByApptGroupIdAndPublished(appt.id as String,true) ? true : false
                }
                appt.participants = notificationService.getParticipantsWithStatus(canvasUserId,appt.id)
                appt
            }
            respond([apptGroups:collectedAppts,locations:locations])
        }
    }

    def viewCourse() {
        String courseId = params.courseId
        respond courseService.getSingleCourse(courseId)
    }

    def listActiveCourses() {
        respond courseService.listCourses(session.userId)
    }

    def viewSingleAppt() {
        Long apptGroupId = Long.valueOf(params.apptGroupId as String)
        String canvasUserId = session.userId
        def apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId, apptGroupId)
        def apptGroupParticipants
        if (apptGroup.participant_type == 'User') {
            apptGroupParticipants = appointmentGroupsService.listUserParticipants(apptGroupId, false)
        } else {
            apptGroupParticipants = appointmentGroupsService.listGroupParticipants(apptGroupId, false)
        }
        def masterApptGroup = null
        if(!apptGroup.can_manage_appointment_group){
            def firstContextCode = apptGroup.context_codes.get(0)
            def managedUser = firstContextCode ? courseService.listManagedUsersInCourse(firstContextCode.split('_')[1]).get(0) : null
            if(managedUser){
                masterApptGroup = appointmentGroupsService.getSingleAppointmentGroup(managedUser.id as String, apptGroupId)
            }
        }
        //add courses
        Map<String, Course> courses = [:]
        apptGroup.context_codes.each{contextCode ->
            def courseId = contextCode.split('_')[1]
            courses.put(courseId, courseService.getSingleCourse(courseId))
        }
        List<Course> apptCourses = []
        apptGroup.context_codes.each{contextCode ->
            apptCourses.add(courses.get(contextCode.split('_')[1]))
        }
        apptGroup.courses = apptCourses
        //add published status
        apptGroup.isPublished = signup.tool.AppointmentGroup.findByApptGroupIdAndPublished(apptGroup.id as String,true) ? true : false
        //get attachments
        def apptAttachments =[]
        def firstCourseId = apptGroup.context_codes.get(0) ? apptGroup.context_codes.get(0).split('_')[1] : null
        if(firstCourseId){
            apptAttachments = fileService.listFiles(firstCourseId, apptGroup.id as String)
        }
        respond([apptGroup: apptGroup, apptGroupParticipants: apptGroupParticipants, masterApptGroup: masterApptGroup, apptAttachments: apptAttachments])
    }

    def getSingleApptGroup(){
        Long apptGroupId = Long.valueOf(params.apptGroupId as String)
        String canvasUserId = session.userId
        respond appointmentGroupsService.getSingleAppointmentGroup(canvasUserId, apptGroupId)
    }

    def reserveAppt(){
        def rqJson = request.JSON
        def comments = rqJson.comments
        String canvasUserId = session.userId
        String participantId = params.participantId == 'null' ? null : params.participantId
        String apptId = params.apptId
        String attendeeName = usersService.getUserProfile(canvasUserId).name
        CalendarEvent appt = calendarEventsService.getCalendarEvent(apptId,canvasUserId)
        def reserveResp
        if (participantId) {
            reserveResp = calendarEventsService.reserveTimeSlotForUser(participantId as Long, comments, apptId as Long)
        } else {
            reserveResp = calendarEventsService.reserveTimeSlot(canvasUserId, comments, apptId as Long)
        }
        if(reserveResp.status != 200){
            respond([error: true, errorMessage: "You have exceeded the maximum number of appointments allotted. Please un-reserve one of your other appointments and try again."], status: reserveResp.status)
            return
        }
        else {
            NotificationPreference timeSlotReserved = NotificationPreference.findByName('time-slot-reserved')
            def timeSlotReservedPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(appt.appointment_group_id, timeSlotReserved)
            def timeSlotReservedEnabled = timeSlotReservedPref ? timeSlotReservedPref.enabled : true
            if (timeSlotReservedEnabled) {
                if (appt.participant_type == 'User') {
                    attendeeName = participantId ? usersService.getUserProfile(participantId).name : attendeeName
                    notificationService.sendEmailAppt(participantId, appt.appointment_group_id as String, appt, 'New Reservation Confirmation', " has reserved the below time slot for user: ${attendeeName}", false, canvasUserId,'')
                } else if (appt.participant_type == 'Group') {
                    String groupId = reserveResp.json.context_code.split('_')[1]
                    attendeeName = groupsService.getSingleGroup(groupId as Long).name
                    notificationService.sendEmailAppt(participantId, appt.appointment_group_id as String, appt, 'New Reservation Confirmation', " has reserved the below slot for group: ${attendeeName}", false, canvasUserId,'')
                }
            }
        }
        respond([])
    }

    def unreserveAppt(){
        def rqJson = request.JSON
        String comments = rqJson.comments
        String canvasUserId = session.userId
        String apptId = params.apptId
        String reservationId = params.reservationId
        CalendarEvent appt = calendarEventsService.getCalendarEvent(apptId,canvasUserId)
        //time slot unreserved
        NotificationPreference timeSlotUnreserved = NotificationPreference.findByName('time-slot-unreserved')
        def timeSlotUnreservedPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(appt.appointment_group_id, timeSlotUnreserved)
        def timeSlotUnreservedEnabled = timeSlotUnreservedPref ? timeSlotUnreservedPref.enabled : true
        if(timeSlotUnreservedEnabled){
            if(appt.participant_type == 'User'){
                def reservation = appt.child_events.find{it.id == reservationId as Long}
                def attendeeName = reservation.user.name
                notificationService.sendEmailAppt(reservation.user.id as String, appt.appointment_group_id as String, appt,'Reservation Cancelled', " has cancelled the reservation for the user: ${attendeeName}",false, canvasUserId, comments)
            }
            else if(appt.participant_type == 'Group'){
                def reservation = appt.child_events.find{it.id == reservationId as Long}
                def attendeeName = reservation.group.name
                notificationService.sendEmailAppt(reservation.group.id as String, appt.appointment_group_id as String, appt,'Reservation Cancelled', " has cancelled the reservation for the group: ${attendeeName}",false, canvasUserId, comments)
            }
        }
        respond calendarEventsService.deleteCalendarEvent(reservationId, comments).json
    }

    def saveNewApptGroup(){
        def rqJson = request.JSON
        String canvasUserId = session.userId

        //Create Appointment Group
        AppointmentGroupForm apptGroupForm = new AppointmentGroupForm()
        def contextCodes = rqJson.contextCodes.keySet() as List
        def subContextCodes = rqJson.contextCodes.values().flatten() as List
        AppointmentGroup apptGroup = new AppointmentGroup(context_codes: contextCodes, sub_context_codes: subContextCodes, title: rqJson?.title, description: rqJson?.details, location_name: rqJson?.location,
                                       location_address:  rqJson?.address, participants_per_appointment: rqJson?.maxParticipantsPerSlot, max_appointments_per_participant: rqJson?.maxSlotsPerParticipant, participant_visibility: rqJson?.slotVisibility)
        apptGroupForm.setForm(apptGroup, rqJson.publish as Boolean)
        rqJson.newSlots.each{newSlot->
            apptGroupForm.addTimeSlot(newSlot.startTime, newSlot.endTime)
        }
        def newApptGroup = appointmentGroupsService.createAppointmentGroup(canvasUserId, apptGroupForm)
        if(!(newApptGroup instanceof AppointmentGroup)){
            respond([error: true, errorMessage: "Error Creating Appointment Group - ${(newApptGroup.json.errors && newApptGroup.json.errors.appointments[0]) ? newApptGroup.json.errors.appointments[0].message : ''}"], status: newApptGroup.status)
            return
        }

        //Update individual appointments with custom max participant values
        rqJson.newSlots.each{newSlot->
            if(newSlot.maxParticipantsPerSlot){
                Appointment apptToUpdate = newApptGroup.new_appointments.find{it.start_at == newSlot.startTime && it.end_at == newSlot.endTime}
                if(apptToUpdate){
                    apptToUpdate.participants_per_appointment = newSlot.maxParticipantsPerSlot
                    AppointmentForm apptForm = new AppointmentForm()
                    apptForm.setForm(apptToUpdate)
                    calendarEventsService.updateCalendarEvent(apptForm,apptToUpdate.id)
                }
            }
        }

        //Create published status
        new signup.tool.AppointmentGroup(apptGroupId: newApptGroup.id, published: rqJson.publish).save(flush:true)

        //Create notification preferences
        rqJson.notificationPreferences.each{notificationPref ->
            NotificationPreference preference = NotificationPreference.findByName(notificationPref.name as String)
            new ApptGroupNotificationPreference(apptGroupId: newApptGroup.id, preference: preference, enabled: notificationPref.enabled).save(flush:true)
        }

        //Create appropriate notification
        notificationService.sendEmailApptGroup(canvasUserId,newApptGroup,true)

        respond newApptGroup
    }

    def saveExistingApptGroup(){
        def rqJson = request.JSON
        String canvasUserId = session.userId

        //Create Appointment Group
        AppointmentGroupForm apptGroupForm = new AppointmentGroupForm()
        def contextCodes = rqJson.contextCodes.keySet() as List
        def subContextCodes = rqJson.contextCodes.values().flatten() as List
        AppointmentGroup apptGroup = new AppointmentGroup(context_codes: contextCodes, sub_context_codes: subContextCodes, title: rqJson?.title, description: rqJson.details ? rqJson.details : " ", location_name: rqJson.location ? rqJson.location : " ",
                location_address:  rqJson.address ? rqJson.address : " ", participants_per_appointment: rqJson?.maxParticipantsPerSlot, max_appointments_per_participant: rqJson?.maxSlotsPerParticipant, participant_visibility: rqJson?.slotVisibility, workflow_state: rqJson.workflowState)
        apptGroupForm.setForm(apptGroup, rqJson.publish as Boolean)
        rqJson.newSlots.each{newSlot->
            apptGroupForm.addTimeSlot(newSlot.startTime, newSlot.endTime)
        }
        def existingApptGroup = appointmentGroupsService.updateAppointmentGroup(canvasUserId, rqJson.apptGroupId, apptGroupForm)
        if(!(existingApptGroup instanceof AppointmentGroup)){
            def errorMessage = "Error Updating Appointment Group"
            if(existingApptGroup.status == 400){
                errorMessage = "${errorMessage} - ${existingApptGroup.json.errors.appointments[0].message}"
            }
            respond([error: true, errorMessage: errorMessage], status: existingApptGroup.status)
            return
        }

        //Update individual appointments with custom max participant values
        rqJson.newSlots.each{newSlot->
            if(newSlot.maxParticipantsPerSlot){
                Appointment apptToUpdate = existingApptGroup.new_appointments.find{it.start_at == newSlot.startTime && it.end_at == newSlot.endTime}
                if(apptToUpdate){
                    apptToUpdate.participants_per_appointment = newSlot.maxParticipantsPerSlot
                    AppointmentForm apptForm = new AppointmentForm()
                    apptForm.setForm(apptToUpdate)
                    calendarEventsService.updateCalendarEvent(apptForm,apptToUpdate.id)
                }
            }
        }

        //Update published status
        def publishedState = signup.tool.AppointmentGroup.findByApptGroupId(rqJson.apptGroupId as String)
        if(publishedState){
            publishedState.published = rqJson.publish
            publishedState.save(flush:true)
        }
        else{
            new signup.tool.AppointmentGroup(apptGroupId: rqJson.apptGroupId as String, published: rqJson.publish).save(flush:true)
        }
        //cancel reservations for unpublished appointment groups
        AppointmentGroup updatedApptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId,rqJson.apptGroupId as Long)
        if(!rqJson.publish){
            //time slot unreserved
            NotificationPreference timeSlotUnreserved = NotificationPreference.findByName('time-slot-unreserved')
            def timeSlotUnreservedPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(updatedApptGroup.id, timeSlotUnreserved)
            def timeSlotUnreservedEnabled = timeSlotUnreservedPref ? timeSlotUnreservedPref.enabled : true
            updatedApptGroup.appointments.each{appointment->
                appointment.child_events.each{reservation->
                    calendarEventsService.deleteCalendarEvent(reservation.id,"Unpublishing Appointment Group")
                    if(timeSlotUnreservedEnabled){
                        if(updatedApptGroup.participant_type == 'User'){
                            def attendeeName = reservation.user.name
                            notificationService.sendEmailAppt(reservation.user.id as String, updatedApptGroup.id as String, reservation as CalendarEvent,'Reservation Cancelled', " has cancelled the reservation for the user: ${attendeeName}",false, canvasUserId, "Unpublishing Appointment Group")
                        }
                        else if(updatedApptGroup.participant_type == 'Group'){
                            def attendeeName = reservation.group.name
                            notificationService.sendEmailAppt(reservation.group.id as String, updatedApptGroup.id as String, reservation as CalendarEvent,'Reservation Cancelled', " has cancelled the reservation for the group: ${attendeeName}",false, canvasUserId, "Unpublishing Appointment Group")
                        }
                    }
                }
            }
        }

        //Update notification preferences
        rqJson.notificationPreferences.each{notificationPref ->
            NotificationPreference preference = NotificationPreference.findByName(notificationPref.name as String)
            def apptGroupPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(rqJson.apptGroupId as Long,preference)
            if(apptGroupPref){
                apptGroupPref.enabled = notificationPref.enabled
                apptGroupPref.save(flush:true)
            }
            else{
                new ApptGroupNotificationPreference(apptGroupId: rqJson.apptGroupId, preference: preference, enabled: notificationPref.enabled).save(flush:true)
            }
        }

        //Create appropriate notification
        notificationService.sendEmailApptGroup(canvasUserId,existingApptGroup,false)

        respond existingApptGroup
    }

    def uploadFile(){
        String canvasUserId = session.userId
        String apptGroupId = params.apptGroupId
        AppointmentGroup apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId,apptGroupId as Long)
        params['files[]'].each{file->
            apptGroup.context_codes.each{contextCode->
                String courseId = contextCode.split('_')[1]
                fileService.upload(file as MultipartFile,true,courseId,file.originalFilename as String,canvasUserId,apptGroupId)
            }
        }
        respond ([])
    }

    def deleteApptGroup() {
        String canvasUserId = session.userId
        String apptGroupId = params.apptGroupId
        AppointmentGroup apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId,Long.valueOf(apptGroupId))
        def apptGroupDeletedEnabled = params.notifyParticipants == 'true'
        def apptGroupIsPublished = signup.tool.AppointmentGroup.findByApptGroupIdAndPublished(apptGroupId,true) ? true : false
        //notify of deletion
        Set allEmails = []
        if(apptGroupIsPublished){
            //Find Email Addresses
            List<User> allUsers
            List<Group> allGroups
            if(apptGroup.participant_type == 'User'){
                allUsers = appointmentGroupsService.listUserParticipants(apptGroup.id, !apptGroupDeletedEnabled)

                List<String> userIds = new ArrayList<>()
                for(user in allUsers){
                    userIds.add('user_ids[]=' + user.id)
                }
                for(context in apptGroup.context_codes){
                    def courseId = context.split('_')[1]
                    allEmails.addAll(courseService.listSelectUsersInCourse(courseId,userIds).email)
                    allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
                }
            }
            else if(apptGroup.participant_type == 'Group'){
                allGroups = appointmentGroupsService.listGroupParticipants(apptGroup.id, !apptGroupDeletedEnabled)
                for(group in allGroups){
                    allEmails.addAll(groupsService.listGroupUsers(group.id).email)
                }
                for(context in apptGroup.context_codes){
                    def courseId = context.split('_')[1]
                    allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
                }
            }
            println allEmails.join(',')
        }
        String cancelComments = ""
        //delete appt group
        def resp = appointmentGroupsService.deleteAppointmentGroup(apptGroupId, cancelComments)
        if(resp.status != 200){
            respond([error: true, errorMessage: "Error deleting appointment group"], status: resp.status)
            return
        }
        if(apptGroupIsPublished){
            User currentUser = usersService.getUserProfile(canvasUserId)
            notificationService.send(allEmails, 'Sign Up Block Cancelled', "${currentUser.name} has cancelled the below Sign Up block", apptGroup.title, '')
        }

        //delete attachments folder
        apptGroup.context_codes.each{
            def courseId = it.split('_')[1]
            fileService.deleteFolderByApptGroupId(apptGroupId,courseId)
        }
        respond(resp.json, status: 200)
    }

    def deleteApptSlot(){
        String apptSlotId = params.apptSlotId
        String canvasUserId = session.userId
        String comments = params.comments
        CalendarEvent slot = calendarEventsService.getCalendarEvent(apptSlotId,canvasUserId)
        NotificationPreference timeSlotCanceled = NotificationPreference.findByName('time-slot-canceled')
        def timeSlotCanceledPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(slot.appointment_group_id, timeSlotCanceled)
        def timeSlotCanceledEnabled = timeSlotCanceledPref ? timeSlotCanceledPref.enabled : true
        //notify of deletion
        if(timeSlotCanceledEnabled){
            //Find Email Addresses
            Set allEmails = []
            String courseId = slot.effective_context_code.split('_')[1]
            //add all instructor emails
            allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            //add attendee emails if any
            if(slot.child_events_count > 0) {
                if (slot.participant_type == 'User') {
                    List<String> userIds = new ArrayList<>()
                    for (user in slot.child_events.user) {
                        userIds.add('user_ids[]=' + user.id)
                    }
                    allEmails.addAll(courseService.listSelectUsersInCourse(courseId,userIds).email)
                } else if (slot.participant_type == 'Group') {
                    for (group in slot.child_events.group) {
                        allEmails.addAll(groupsService.listGroupUsers(group.id).email)
                    }
                }
            }
            println allEmails.join(',')
            DateTimeFormatter isoInstantFormatter = DateTimeFormatter.ISO_INSTANT
            Instant parsedDate = Instant.from(isoInstantFormatter.parse(slot.start_at))
            LocalDateTime ldt = LocalDateTime.ofInstant(parsedDate, ZoneId.of("America/New_York"))
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, MMM d h:mm a")
            User currentUser = usersService.getUserProfile(canvasUserId)
            notificationService.send(allEmails, 'Time Slot Cancelled', "${currentUser.name} has cancelled the below time slot", slot.title + ' - ' + ldt.format(formatter), comments)
        }

        def resp = calendarEventsService.deleteCalendarEvent(apptSlotId, "")
        response.setContentType("application/json")
        response.setStatus(resp.status)
        render resp.json
    }

    def saveOneAppt(Appointment appt){
        AppointmentForm apptForm = new AppointmentForm()
        apptForm.setForm(appt)
        String canvasUserId = session.userId
        def resp = calendarEventsService.updateCalendarEvent(apptForm,appt.id)
        if(resp.status != 200){
            respond([error: true, errorMessage: "Slot update conflicts with another appointment slot"], status: resp.status)
            return
        }
        CalendarEvent slot = calendarEventsService.getCalendarEvent(appt.id as String,canvasUserId)
        NotificationPreference timeSlotUpdated = NotificationPreference.findByName('time-slot-updated')
        def timeSlotUpdatedPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(slot.appointment_group_id, timeSlotUpdated)
        def timeSlotUpdatedEnabled = timeSlotUpdatedPref ? timeSlotUpdatedPref.enabled : true
        //notify of deletion
        if(timeSlotUpdatedEnabled){
            //Find Email Addresses
            Set allEmails = []
            String courseId = slot.effective_context_code.split('_')[1]
            //add all instructor emails
            allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            //add attendee emails if any
            if(slot.child_events_count > 0) {
                if (slot.participant_type == 'User') {
                    List<String> userIds = new ArrayList<>()
                    for (user in slot.child_events.user) {
                        userIds.add('user_ids[]=' + user.id)
                    }
                    allEmails.addAll(courseService.listSelectUsersInCourse(courseId,userIds).email)
                } else if (slot.participant_type == 'Group') {
                    for (group in slot.child_events.group) {
                        allEmails.addAll(groupsService.listGroupUsers(group.id).email)
                    }
                }
            }
            println allEmails.join(',')
            DateTimeFormatter isoInstantFormatter = DateTimeFormatter.ISO_INSTANT
            Instant parsedDate = Instant.from(isoInstantFormatter.parse(slot.start_at))
            LocalDateTime ldt = LocalDateTime.ofInstant(parsedDate, ZoneId.of("America/New_York"))
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, MMM d h:mm a")
            User currentUser = usersService.getUserProfile(canvasUserId)
            notificationService.send(allEmails, 'Time Slot Updated', "${currentUser.name} has updated the below time slot", slot.title + ' - ' + ldt.format(formatter), '')
        }
        respond resp.json
    }

    def getUserEvents() {
        String participantType = params.participantType
        DateTimeFormatter isoInstantFormatter = DateTimeFormatter.ISO_INSTANT
        def userIds = [session.userId] as Set
        if(participantType == 'Group'){
            List<Group> groups = appointmentGroupsService.listGroupParticipants(params.apptGroupId as Long,false)
            groups.each{group->
                def groupUserIds = groupsService.listGroupUsers(group.id).id
                if(groupUserIds.contains(session.userId as Integer)){
                    userIds.addAll(groupUserIds)
                    return
                }
            }
        }
        List<CalendarEvent> calendarEvents = []
        userIds.each{userId->
            def courses = courseService.listCoursesAsStudent(userId as String)
            List<String> contextCodes = []
            courses.each {course ->
                contextCodes.add("context_codes[]=course_${course.id}")
            }
            def groups = groupsService.listUsersGroups(userId as String)
            groups.each{group->
                if(!group.concluded){
                    contextCodes.add("context_codes[]=group_${group.id}")
                }
            }
            contextCodes.collate(10).each {contextCodeSubList->
                calendarEvents.addAll(calendarEventsService.listCalendarEventsForCurrentUser(userId as String, params.startDate as String, params.endDate as String, contextCodeSubList.join('&')))
            }
        }

        calendarEvents.removeAll{
            Instant.from(isoInstantFormatter.parse(it.end_at)).isBefore(Instant.from(isoInstantFormatter.parse(params.startDate as String))) ||
                    Instant.from(isoInstantFormatter.parse(it.start_at)) == Instant.from(isoInstantFormatter.parse(params.endDate as String)) ||
                    Instant.from(isoInstantFormatter.parse(it.end_at)) == Instant.from(isoInstantFormatter.parse(params.startDate as String))
        }
        response.setContentType("application/json")
        render calendarEvents as JSON
    }

    /** Default exception handler */
    def handleException(final Exception exception) {
        flash.error = 'Error Occurred - Please try again later'
        println "Exception occurred."
        exception?.printStackTrace()
        redirect(action: 'viewAll')
    }

    def downloadParticipantSummary(){
        Long apptGroupId = Long.valueOf(params.apptGroupId as String)
        String canvasUserId = session.userId
        def apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId, apptGroupId)
        def courseMap = [:]
        apptGroup.context_codes.each {contextCode->
            def courseId = contextCode.split('_')[1]
            courseMap.put(courseId,courseService.getSingleCourse(courseId).name)
        }
        def apptGroupParticipants
        if (apptGroup.participant_type == 'User') {
            apptGroupParticipants = appointmentGroupsService.listUserParticipants(apptGroupId, false)
        } else {
            apptGroupParticipants = appointmentGroupsService.listGroupParticipants(apptGroupId, false)
            apptGroupParticipants.each{group ->
                if(group.members_count > 0){
                    group.groupUsers = groupsService.listGroupUsers(group.id)
                }
            }
        }
        def headers
        def apptGroupMap = apptGroup.getApptMapByDate()
        DateTimeFormatter isoInstantFormatter = DateTimeFormatter.ISO_INSTANT
        def downloadFormat = []
        if(apptGroup.participant_type == 'User'){
            headers = ['Date', 'Calendar', 'Time', 'Name']
            apptGroupMap.each{date,apptList ->
                apptList.each {appt ->
                    def users = apptGroupParticipants.findAll{appt.child_events.user.id.contains(it.id)}
                    Instant parsedDate = Instant.from(isoInstantFormatter.parse(appt.start_at))
                    LocalDateTime ldt = LocalDateTime.ofInstant(parsedDate, ZoneId.of("America/New_York"))
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a")
                    users.each {
                        def effectiveCourseId = calendarEventsService.getCalendarEvent(appt.id as String,it.id as String).effective_context_code.split('_')[1]
                        downloadFormat.add([date, courseMap.get(effectiveCourseId), ldt.format(formatter),"\"${it.sortable_name}\""])
                    }
                }
            }
        }
        else{
            headers = ['Date', 'Calendar', 'Time', 'Group Name', 'Members']
            apptGroupMap.each{date,apptList ->
                apptList.each {appt ->
                    def groups = apptGroupParticipants.findAll{appt.child_events.group.id.contains(it.id)}
                    Instant parsedDate = Instant.from(isoInstantFormatter.parse(appt.start_at))
                    LocalDateTime ldt = LocalDateTime.ofInstant(parsedDate, ZoneId.of("America/New_York"))
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a")
                    groups.each {group->
                        def groupMemberNames = group.members_count > 0 ? group.groupUsers.sortable_name.join(';') : ''
                        downloadFormat.add([date,courseMap.get(group.course_id as String),ldt.format(formatter),"\"${group.name}\"","\"${groupMemberNames}\""])
                    }
                }
            }
        }

        response.setContentType("text/csv")
        response.setHeader("Content-disposition", "filename=\"${apptGroup.title}-participants.csv\"")
        def outs = response.outputStream
        response.outputStream << headers.join(',') + '\n'
        downloadFormat.each { row ->
            outs << row.join(',') + '\n'
        }
        outs.flush()
        outs.close()
    }

    def deleteAttachment(){
        String apptGroupId = params.apptGroupId
        String fileName = params.fileName
        String canvasUserId = session.userId
        def apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId, apptGroupId as Long)
        apptGroup.context_codes.each{
            def courseId = it.split('_')[1]
            fileService.deleteFileWithName(fileName,courseId,apptGroupId)
        }
    }

    def updatePublishedState(){
        String apptGroupId = params.apptGroupId
        Boolean published = params.published == 'true'
        def apptGroup = signup.tool.AppointmentGroup.findByApptGroupId(apptGroupId)
        if(apptGroup){
            apptGroup.published = published
            apptGroup.save(flush:true)
        }
        else{
            new signup.tool.AppointmentGroup(apptGroupId: apptGroupId, published: published).save(flush:true)
        }
    }
}
