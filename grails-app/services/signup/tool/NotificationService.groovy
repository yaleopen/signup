package signup.tool

import com.instructure.canvas.CalendarEvent
import com.instructure.canvas.Group
import com.instructure.canvas.User
import grails.plugin.asyncmail.AsynchronousMailService
import grails.transaction.Transactional

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Transactional
class NotificationService {

    def courseService
    def usersService
    def groupsService
    def appointmentGroupsService
    AsynchronousMailService asynchronousMailService

    def send(Set emailAddresses, String subjectText, String message1, String apptDetails, String message2) {
        emailAddresses.retainAll{it instanceof String}
        asynchronousMailService.sendMail {
            bcc emailAddresses as List
            subject subjectText
            html view: "/notification/emailTemplate", model: [message1: message1, apptDetails: apptDetails, message2: message2]

            delete true
        }
    }

    def sendBody(Set emailAddresses, String subjectText, String body) {
        emailAddresses.retainAll{it instanceof String}
        asynchronousMailService.sendMail {
            bcc emailAddresses as List
            subject subjectText
            text body

            delete true
        }
    }

    def sendEmailAppt(String participantId, String apptGroupId, CalendarEvent slot, String subjectText, String message1, boolean notifyAll, String canvasUserId, String message2){
        User currentUser = usersService.getUserProfile(canvasUserId)
        //Find Email Addresses
        Set allEmails = []
        String courseId = slot.effective_context_code.split('_')[1]
        //add all instructor emails
        allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
        if(notifyAll){
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
        }
        else{
            if(participantId){
                if(slot.participant_type == 'User'){
                    allEmails.add(usersService.getUserProfile(participantId).primary_email)
                }
                else if(slot.participant_type == 'Group'){
                    allEmails.addAll(groupsService.listGroupUsers(participantId as Long).email)
                }
            }
            else{
                allEmails.add(currentUser.primary_email)
            }
        }
        println "${apptGroupId} - ${subjectText} - ${allEmails.join(',')}"
        DateTimeFormatter isoInstantFormatter = DateTimeFormatter.ISO_INSTANT
        Instant parsedDate = Instant.from(isoInstantFormatter.parse(slot.start_at))
        LocalDateTime ldt = LocalDateTime.ofInstant(parsedDate, ZoneId.of(currentUser.time_zone))
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, MMM d h:mm a")
        send(allEmails, subjectText, currentUser.name + message1, slot.title + ' - ' + ldt.format(formatter),message2)
    }

    def sendEmailApptGroup(String canvasUserId, com.instructure.canvas.AppointmentGroup apptGroup, Boolean isNewAppt){
        List<User> allUsers
        List<Group> allGroups
        Set allEmails = []
        User currentUser = usersService.getUserProfile(canvasUserId)
        def apptGroupUpdatePref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(apptGroup.id, NotificationPreference.findByName('appt-group-updated'))
        def apptGroupPublishedPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(apptGroup.id, NotificationPreference.findByName('appt-group-published'))
        //return if appt group preferences are disabled
        if(!(isNewAppt && apptGroupPublishedPref.enabled) && !(!isNewAppt && apptGroupUpdatePref.enabled)){
            return
        }
        if(apptGroup.participant_type == 'User' && apptGroup.workflow_state == 'active'){
            allUsers = appointmentGroupsService.listUserParticipants(apptGroup.id, false)

            List<String> userIds = new ArrayList<>()
            for(user in allUsers){
                userIds.add('user_ids[]=' + user.id)
            }
            for(context in apptGroup.context_codes){
                def courseId = context.split('_')[1] as String
                allEmails.addAll(courseService.listSelectUsersInCourse(courseId,userIds).email)
                allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            }

            if(isNewAppt && apptGroupPublishedPref.enabled){
                send(allEmails, 'New Sign Up Block Available', "${currentUser.name} has created a new Sign Up block", apptGroup.title, '')
            }
            else if(!isNewAppt && apptGroupUpdatePref.enabled){
                send(allEmails, 'Sign Up Block Updated', "${currentUser.name} has updated the below Sign Up block", apptGroup.title, '')
            }
        }
        else if(apptGroup.participant_type == 'Group' && apptGroup.workflow_state == 'active'){
            allGroups = appointmentGroupsService.listGroupParticipants(apptGroup.id, false)
            for(group in allGroups){
                allEmails.addAll(groupsService.listGroupUsers(group.id).email)
            }
            for(context in apptGroup.context_codes){
                def courseId = context.split('_')[1] as String
                allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            }

            if(isNewAppt && apptGroupPublishedPref.enabled){
                send(allEmails, 'New Sign Up Block Available', "${currentUser.name} has created a new Sign Up block", apptGroup.title, '')
            }
            else if(!isNewAppt && apptGroupUpdatePref.enabled){
                send(allEmails, 'Sign Up Block Updated', "${currentUser.name} has updated the below Sign Up block", apptGroup.title, '')
            }
        }
        println allEmails.join(',')
    }

    def getParticipantsWithStatus(String canvasUserId, Long apptGroupId){
        def participantsWithRegistrationStatus = []
        com.instructure.canvas.AppointmentGroup apptGroup = appointmentGroupsService.getSingleAppointmentGroup(canvasUserId,apptGroupId)
        if(!apptGroup){
            return participantsWithRegistrationStatus
        }
        if(apptGroup.participant_type == 'User'){
            def allUsers = appointmentGroupsService.listUserParticipants(apptGroup.id, false)
            def registeredUsers = appointmentGroupsService.listUserParticipants(apptGroup.id, true)
            registeredUsers.each { user ->
                participantsWithRegistrationStatus.add([id: user.id, name: user.name, reserved: true])
            }
            allUsers.removeAll{registeredUsers.id.contains(it.id)}
            allUsers.each { user ->
                participantsWithRegistrationStatus.add([id: user.id, name: user.name, reserved: false])
            }
        }
        else if(apptGroup.participant_type == 'Group'){
            def allGroups = appointmentGroupsService.listGroupParticipants(apptGroup.id, false)
            def registeredGroups = appointmentGroupsService.listGroupParticipants(apptGroup.id, true)
            registeredGroups.each { group ->
                participantsWithRegistrationStatus.add([id: group.id, name: group.name, reserved: true])
            }
            allGroups.removeAll{registeredGroups.id.contains(it.id)}
            allGroups.each { group ->
                participantsWithRegistrationStatus.add([id: group.id, name: group.name, reserved: false])
            }
        }
        return participantsWithRegistrationStatus
    }
}
