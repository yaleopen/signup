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
