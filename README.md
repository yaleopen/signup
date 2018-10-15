# SignUp for Canvas
Manage Appointment Groups and Time Slots in Canvas. More info [here](http://help.canvas.yale.edu/m/55452/l/914686-how-do-i-use-the-sign-up-tool).

## Dev Setup
1. Install [Grails 3.3.2](https://grails.org/download.html#sdkman)

2. Create environment variables for `application.yml` properties
    ```yaml
    mail:
        host: '${MAIL_HOST}'
        default:
            from: '${MAIL_FROM_ADDRESS}'
            replyTo: '${MAIL_REPLYTO_ADDRESS}'
    canvas:
        #Canvas Admin Access Token
        oauthToken: '${CANVAS_API_TOKEN}'
        #Base URL ex. https://<school>.instructure.com
        canvasBaseUrl: '${CANVAS_BASE_URL}'
        #Shared Secret used during LTI Install
        ltiSecret: '${SIGNUP_LTI_SECRET}'
        #Comma Delimited List of Canvas Role IDs that can manage Calendars
        #Viewable at Admin -> Permissions -> Course Calendar
        manageCalendarRoles: '${SIGNUP_CALENDAR_ROLE_IDS}'
        #Namespace used for storing custom user data via Users API
        customDataNS: '${CANVAS_API_CUSTOM_NS}'
    dataSource:
        username: '${DB_USERNAME}'
        password: '${DB_PASSWORD}'
        url: '${DB_URL}'
    ```
    
3. Build & Run: `grails run-app`

4. Install LTI in Canvas via XML Config
    ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/
   imslticc_v1p0"
       xmlns:blti = "http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
       xmlns:lticm ="http://www.imsglobal.org/xsd/imslticm_v1p0"
       xmlns:lticp ="http://www.imsglobal.org/xsd/imslticp_v1p0"
       xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation = "http://www.imsglobal.org/xsd/imslticc_v1p0
   http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
       http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://
   www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
       http://www.imsglobal.org/xsd/imslticm_v1p0 http://
   www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
       http://www.imsglobal.org/xsd/imslticp_v1p0 http://
   www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
   <blti:launch_url>http://<HOST>:8080/signup/LTI/launch</blti:launch_url>
       <blti:title>Signup Tool</blti:title>
       <blti:description>Alternate to Canvas Scheduler</blti:description>
       <blti:extensions platform="canvas.instructure.com">
         <lticm:property name="privacy_level">public</lticm:property>
         <lticm:options name="global_navigation">
           <lticm:property name="icon_url">http://<HOST>:8080/signup/assets/calendar-clock_lg.svg</lticm:property>
           <lticm:property name="default">enabled</lticm:property>
           <lticm:property name="enabled">true</lticm:property>
           <lticm:property name="display_type">full_width</lticm:property>
         </lticm:options>
       </blti:extensions>
   </cartridge_basiclti_link>
    ```
    
## Features
#### Creating Appointment Blocks
* Any role in Canvas that has the ability to manage a course calendar will be able to create & manage Appointment Blocks (role ids configured in application.yml)
    * The ability to create new Appointment Blocks is limited to the active term
* New Appointment Form
    * Location is stored as custom user data in Canvas
        * scope: /signup/location
        * ns: configured in application.yml
    * Calendars are limited to courses in the active term where the user is enrolled as a role with calendar management permissions
#### Edit Appointment Blocks
* Slot Management
    * New slots can be added, but won't be created until submitting the form
    * Existing slots can be updated/deleted through the Save/Trash icons on the corresponding row
#### Reserving Appointment Slot
* Calendar managers (ie. Instructors, TAs, etc) can unreserve/reserve slots on behalf of a student or group
* Students can unreserve/reserve on behalf of themselves or their Group
    * Student calendars are validated for both individual and Group reservation (warning will appear)
    * If conflict exists, an option to delete conflicting appointment is displayed
#### Notifications
* Notifications are managed in the MySQL database
    * When Appointment Block is created, by default all notifications are disabled for the block
* Direct Message
    * Calendar managers can send messages to participants of an Appointment Block
* The email address is retrieved from the user's Canvas profile
* All emails are sent asynchronously
#### Viewing Participant Summary
* Calendar managers can view a summary of all reservations in the Appointment Block
#### Deleting Appointment Blocks
* Deleting an Appointment Block will also delete all its slots and existing reservations
#### Installation
* The tool is installed in the Global Navigation bar
* "LOR External Tools" Feature needs to be enabled for it to appear
* The icon is packaged with the application and retrieved via URL

## Limitations
#### Canvas API Restrictions
* Unpublishing Appointment Groups not allowed
    * Solved by storing published status in MySQL DB, although still visible in Canvas Scheduler
* Updating Calendar
    * Courses & Sections - Removing course/section is not supported by Canvas API, only adding
    * Groups - Changing Group Calendar is not supported by Canvas API
* Participant Visibility
    * Changing from "Not Visible" to "Visible" does not reflect retroactively, only new slots
#### Notifications from Canvas are still triggered
* Canvas notifications are still triggered by appointment group events. The Canvas user would need to disable their “Scheduling” Notifications
#### Course Home Calendar Links point to Canvas Scheduler
* Adding custom javascript to Canvas theme is needed to change these links 
#### Instructor can reserve slots on behalf of student/groups
* Student/Group calendars are not validated when an Instructor does this, so conflicts may exist



