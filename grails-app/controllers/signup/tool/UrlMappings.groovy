package signup.tool

class UrlMappings {

    static mappings = {
        "/$controller/$action?/$id?(.$format)?"{
            constraints {
                // apply constraints here
            }
        }

        "/"(view:"/index")

        "/reserve"(controller: 'appointmentGroups', action: 'manageTimeSlot', method: 'POST')

        "/appointmentGroups/slot/$id"(controller: 'appointmentGroups', action: 'saveOneAppt', method: 'PUT')
        "/appointmentGroups/slot/$apptSlotId"(controller: 'appointmentGroups', action: 'deleteApptSlot', method: 'DELETE')
        "/appointmentGroups/slot/$apptId"(controller: 'appointmentGroups', action: 'reserveAppt', method: 'POST')
        "/appointmentGroups/slot/$apptId/unreserve"(controller: 'appointmentGroups', action: 'unreserveAppt', method: 'PUT')
        "/appointmentGroups/events/$userId"(controller: 'appointmentGroups', action: 'getUserEvents', method: 'GET')
        "/appointmentGroups/$apptGroupId"(controller: 'appointmentGroups', action: 'deleteApptGroup', method: 'DELETE')
        "/appointmentGroups/$apptGroupId/files"(controller: 'appointmentGroups', action: 'uploadFile', method: 'POST')
        "/appointmentGroups/$apptGroupId/attachment"(controller: 'appointmentGroups', action: 'deleteAttachment', method: 'DELETE')
        "/appointmentGroups/$apptGroupId"(controller: 'appointmentGroups', action: 'updatePublishedState', method: 'PUT')
        "/appointmentGroups/single/$apptGroupId"(controller: 'appointmentGroups', action: 'getSingleApptGroup', method: 'GET')
        "/appointmentGroups/single/$apptGroupId/slots"(controller: 'appointmentGroups', action: 'viewSingleAppt', method: 'GET')
        "/appointmentGroups"(controller: 'appointmentGroups', action: 'saveNewApptGroup', method: 'POST')

        "/notification/preferences/$apptGroupId"(controller: 'notification', action: 'updateNotificationPreferences', method: 'POST')
        "/notification/preferences/$apptGroupId"(controller: 'notification', action: 'getNotificationPrefsForApptGroup', method: 'GET')
        "/notification/$apptGroupId"(controller: 'notification', action: 'sendEmail', method: 'POST')

        "/profile"(controller: 'appointmentGroups', action: 'getUserProfile', method: 'GET')

    }
}
