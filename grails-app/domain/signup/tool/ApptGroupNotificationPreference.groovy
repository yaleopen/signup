package signup.tool


class ApptGroupNotificationPreference {

    Long apptGroupId
    NotificationPreference preference
    Boolean enabled

    static constraints = {
    }

    static mapping = {
        version false
        preference fetch: 'join'
    }
}
