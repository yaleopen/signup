package signup.tool

import grails.rest.Resource

@Resource(uri='/notificationprefs')
class NotificationPreference {

    String name

    static constraints = {
    }

    static mapping = {
        version false
    }
}
