package com.instructure.canvas

import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray
import org.grails.web.json.JSONObject
import signup.tool.ApptGroupNotificationPreference

@Transactional
class AppointmentGroupsService extends CanvasAPIBaseService {

    def usersService

    List<AppointmentGroup> listAppointmentGroups(String canvasUserId, String scope, String includePastAppts){
        def url = "${canvasBaseURL}/api/v1/appointment_groups?as_user_id=${canvasUserId}&scope=${scope}&include_past_appointments=${includePastAppts}&include[]=participant_count&include[]=appointments"
        def resp = restClient.get(url){
            auth("Bearer ${oauthToken}")
        }
        log.info("ACTION=External_API DESCRIPTION=List Appt Groups REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        JSONArray respArr = (JSONArray) resp.json
        List<AppointmentGroup> resultList = new ArrayList<AppointmentGroup>(respArr)
        processResponsePages(resp,resultList)
        resultList.each {
            if(scope == 'manageable'){
                it.can_manage_appointment_group = true
                it.enabledNotificationPreferences = ApptGroupNotificationPreference.findAllByApptGroupIdAndEnabled(it.id,true).preference.name
                it.disabledNotificationPreferences = ApptGroupNotificationPreference.findAllByApptGroupIdAndEnabled(it.id,false).preference.name
            }
        }
        return resultList
    }

    def createAppointmentGroup(String canvasUserId, AppointmentGroupForm apptGroupForm){
        def url = "${canvasBaseURL}/api/v1/appointment_groups?as_user_id=${canvasUserId}"
        def resp = restClient.post(url){
            auth("Bearer ${oauthToken}")
            contentType('application/x-www-form-urlencoded')
            body(apptGroupForm.form)
        }
        log.info("ACTION=External_API DESCRIPTION=Create Appt Group REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        if(resp.status != 201){
            return resp
        }
        AppointmentGroup apptGroup = new AppointmentGroup((JSONObject)resp.json)
        saveLocation(canvasUserId, apptGroup)
        return apptGroup
    }

    def updateAppointmentGroup(String canvasUserId, apptGroupId, AppointmentGroupForm apptGroupForm){
        def url = "${canvasBaseURL}/api/v1/appointment_groups/${apptGroupId}?as_user_id=${canvasUserId}"
        def resp = restClient.put(url){
            auth("Bearer ${oauthToken}")
            contentType('application/x-www-form-urlencoded')
            body(apptGroupForm.form)
        }
        println resp.json
        log.info("ACTION=External_API DESCRIPTION=Update Appt Group REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        if(resp.status != 200){
            return resp
        }
        if(resp.status == 500){
            return getSingleAppointmentGroup(canvasUserId,apptGroupId as Long)
        }
        AppointmentGroup apptGroup = new AppointmentGroup((JSONObject)resp.json)
        saveLocation(canvasUserId, apptGroup)
        return apptGroup
    }

    def saveLocation(String canvasUserId, AppointmentGroup apptGroup){
        def locations = usersService.loadCustomData(canvasUserId, 'location')
        if(apptGroup && apptGroup.location_name){
            if(!locations.contains(apptGroup.location_name)){
                locations.add(apptGroup.location_name)
                usersService.storeCustomData(canvasUserId,'location',locations.join('|'))
            }
        }
    }

    AppointmentGroup getSingleAppointmentGroup(String canvasUserId, Long apptGroupId){
        def url = "${canvasBaseURL}/api/v1/appointment_groups/${apptGroupId}?as_user_id=${canvasUserId}&include[]=child_events&include[]=participant_count"
        def resp = restClient.get(url){
            auth("Bearer ${oauthToken}")
        }
        log.info("ACTION=External_API DESCRIPTION=Get Appt Group REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        if(resp.status != 200){
            return null
        }
        AppointmentGroup apptGroup = new AppointmentGroup((JSONObject)resp.json)
        if(apptGroup.appointments != null && apptGroup.appointments.size() > 0){
            apptGroup.can_manage_appointment_group = apptGroup.appointments.get(0).can_manage_appointment_group
        }
        return apptGroup
    }

    List<User> listUserParticipants(Long apptGroupId, boolean restrictRegistered){
        def url = "${canvasBaseURL}/api/v1/appointment_groups/${apptGroupId}/users"
        if(restrictRegistered){
            url = "${url}?registration_status=registered"
        }
        def resp = restClient.get(url){
            auth("Bearer ${oauthToken}")
        }
        log.info("ACTION=External_API DESCRIPTION=List Appt Group Users REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        JSONArray respArr = (JSONArray) resp.json
        List<User> resultList = new ArrayList<User>(respArr)
        processResponsePages(resp,resultList)

        return resultList.unique{it.id}
    }

    List<Group> listGroupParticipants(Long apptGroupId, boolean restrictRegistered){
        def url = "${canvasBaseURL}/api/v1/appointment_groups/${apptGroupId}/groups"
        if(restrictRegistered){
            url = "${url}?registration_status=registered"
        }
        def resp = restClient.get(url){
            auth("Bearer ${oauthToken}")
        }
        log.info("ACTION=External_API DESCRIPTION=List Appt Group Groups REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        JSONArray respArr = (JSONArray) resp.json
        List<Group> resultList = new ArrayList<Group>(respArr)
        processResponsePages(resp,resultList)

        return resultList.unique{it.id}
    }

    def deleteAppointmentGroup(apptGroupId, String comments){
        def url = "${canvasBaseURL}/api/v1/appointment_groups/${apptGroupId}"
        def resp = restClient.delete(url){
            auth("Bearer ${oauthToken}")
            json{
                cancel_reason = comments
            }
        }
        log.info("ACTION=External_API DESCRIPTION=Delete Appt Group REQUEST_URL=${url} HTTP_STATUS=${resp.status}")
        return resp
    }
}
