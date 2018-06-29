package signup.tool.message

import grails.validation.Validateable

class Message implements Validateable {
    List<MessageUser> selectedRecipients
    String message
    String subject
    String participantType
    List<String> contextCodes
}
