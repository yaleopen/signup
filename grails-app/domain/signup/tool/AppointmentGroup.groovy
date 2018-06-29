package signup.tool

class AppointmentGroup {

    String apptGroupId
    Boolean published

    static constraints = {
        apptGroupId unique: true
    }

    static mapping = {
        version false
    }
}
