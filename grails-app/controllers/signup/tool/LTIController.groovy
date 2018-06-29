package signup.tool

import org.imsglobal.lti.launch.LtiVerificationResult
import org.imsglobal.lti.launch.LtiVerifier

class LTIController {

    def launch() {
        // Log incoming request
        log.debug("Request URL: " + request.getRequestURL().toString())
        log.debug("Query String: " + request.getQueryString())
        log.debug("HTTP Method: " + request.getMethod())
        for(header in request.getHeaderNames()){
            log.debug("${header}:${request.getHeader(header)}")
        }
        for(param in request.getParameterMap()){
            log.debug("${param.key}:${param.value}")
        }

        // Authenticate initial LTI Request and store request params
        if(request.getParameter("oauth_consumer_key") != null){
            LtiVerifier ltiVerifier = new LtiOauthVerifierSSL()
            def ltiSecret = grailsApplication.config.getProperty('canvas.ltiSecret')
            LtiVerificationResult ltiResult = ltiVerifier.verify(request, ltiSecret)
            if(ltiResult.success){
                session["user"] = params.custom_canvas_user_login_id
                session["courseId"] = params.custom_canvas_course_id
                session["userId"] = params.custom_canvas_user_id
                session["user-agent"] = request.getHeader('user-agent')
                session["ext_roles"] = params.ext_roles
                session["oauth_nonce"] = params.oauth_nonce
                render(view: "/index")
            }
            else{
                log.error("LTI Result not SUCCESS: " + ltiResult.getMessage())
                respond ltiResult
            }
        }
    }
}
