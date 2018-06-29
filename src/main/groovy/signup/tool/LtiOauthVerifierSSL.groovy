package signup.tool

import grails.util.Environment
import grails.util.Holders
import net.oauth.*
import net.oauth.server.OAuthServlet
import org.imsglobal.lti.BasicLTIUtil
import org.imsglobal.lti.launch.*

import javax.servlet.http.HttpServletRequest
import java.util.logging.Logger

class LtiOauthVerifierSSL implements LtiVerifier{

    public static final String OAUTH_KEY_PARAMETER= "oauth_consumer_key"

    private final static Logger logger = Logger.getLogger(LtiOauthVerifier.class.getName())


    @Override
    LtiVerificationResult verify(HttpServletRequest request, String secret) throws LtiVerificationException {
        String realPath = OAuthServlet.getRequestURL(request)
        if(Environment.getCurrent() == Environment.PRODUCTION){
            realPath = BasicLTIUtil.getRealPath(request, Holders.getConfig().getAt("publicURL").toString())
        }
        OAuthMessage oam = OAuthServlet.getMessage(request, realPath)
        String oauth_consumer_key
        try {
            oauth_consumer_key = oam.getConsumerKey()
        } catch (Exception e) {
            return new LtiVerificationResult(false, LtiError.BAD_REQUEST, "Unable to find consumer key in message")
        }

        OAuthValidator oav = new SimpleOAuthValidator()
        OAuthConsumer cons = new OAuthConsumer(null, oauth_consumer_key, secret, null)
        OAuthAccessor acc = new OAuthAccessor(cons)

        try {
            oav.validateMessage(oam, acc)
        } catch (Exception e) {
            return new LtiVerificationResult(false, LtiError.BAD_REQUEST, "Failed to validate: " + e.getLocalizedMessage())
        }
        return new LtiVerificationResult(true, new LtiLaunch(request))
    }

    @Override
    LtiVerificationResult verifyParameters(Map<String, String> parameters, String url, String method, String secret) throws LtiVerificationException {
        OAuthMessage oam = new OAuthMessage(method, url, parameters.entrySet())
        OAuthConsumer cons = new OAuthConsumer(null, parameters.get(OAUTH_KEY_PARAMETER), secret, null)
        OAuthValidator oav = new SimpleOAuthValidator()
        OAuthAccessor acc = new OAuthAccessor(cons)

        try {
            oav.validateMessage(oam, acc)
        } catch (Exception e) {
            return new LtiVerificationResult(false, LtiError.BAD_REQUEST, "Failed to validate: " + e.getLocalizedMessage() + ", Parameters: " + Arrays.toString(parameters.entrySet().toArray()))
        }
        return new LtiVerificationResult(true, new LtiLaunch(parameters))
    }
}
