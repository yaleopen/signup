package signup.tool

import grails.converters.JSON
import signup.tool.message.Message

class NotificationController {
    def notificationService
    def courseService
    def groupsService

    static responseFormats = ['json', 'html']

    def updateNotificationPreferences() {
        Long apptGroupId = Long.valueOf(params.apptGroupId as String)
        List<NotificationPreference> allPrefs = NotificationPreference.list()
        allPrefs.each{pref ->
            Boolean isEnabled = params.get(pref.name) == '1'
            ApptGroupNotificationPreference apptGroupPref = ApptGroupNotificationPreference.findByApptGroupIdAndPreference(apptGroupId,pref)
            if(apptGroupPref && apptGroupPref.enabled != isEnabled){
                apptGroupPref.enabled = isEnabled
                apptGroupPref.save(flush:true)
            }
            else if(!apptGroupPref){
                new ApptGroupNotificationPreference(apptGroupId: apptGroupId, preference: pref, enabled: isEnabled).save(flush:true)
            }
        }
        flash.message = "Notification preferences updated"
        redirect(controller: 'appointmentGroups', action: 'viewAll')
    }

    def sendEmail(Message messageRequest){
        Set allEmails = []
        if(messageRequest.participantType == 'User'){
            for(context in messageRequest.contextCodes){
                def courseId = context.split('_')[1]
                if(messageRequest.selectedRecipients.size() > 0){
                    allEmails.addAll(courseService.listSelectUsersInCourse(courseId,messageRequest.selectedRecipients.value.collect{ "user_ids[]=${it}"}).email)
                }
                allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            }
        }
        else if(messageRequest.participantType == 'Group'){
            for(groupId in messageRequest.selectedRecipients.value){
                allEmails.addAll(groupsService.listGroupUsers(groupId as Long).email)
            }
            for(context in messageRequest.contextCodes){
                def courseId = context.split('_')[1]
                allEmails.addAll(courseService.listManagedUsersInCourse(courseId).email)
            }
        }
        println allEmails.join(',')
        notificationService.sendBody(allEmails, messageRequest.subject, messageRequest.message)
        respond ([])
    }

    def getNotificationPrefsForApptGroup(){
        String apptGroupId = params.apptGroupId
        render ApptGroupNotificationPreference.findAllByApptGroupId(apptGroupId as Long) as JSON
    }

    /** Default exception handler */
    def handleException(final Exception exception) {
        flash.message = 'Error Occurred - Please try again later'
        println "Exception occurred. ${exception?.message}"
        redirect(controller: 'appointmentGroups', action: 'viewAll')
    }
}
