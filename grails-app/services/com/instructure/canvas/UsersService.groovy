package com.instructure.canvas

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONObject
import org.springframework.beans.factory.annotation.Value

@Transactional
class UsersService extends CanvasAPIBaseService{

    @Value('${canvas.customDataNS}')
    String customDataNS

    def storeCustomData(String canvasUserId, String scope, String data){
        CustomData customData = new CustomData(ns: customDataNS, data: data)
        def resp = restClient.put(canvasBaseURL + '/api/v1/users/' + canvasUserId + '/custom_data/signup/' + scope){
            auth('Bearer ' + oauthToken)
            contentType('application/json')
            body(customData as JSON)
        }
        resp.json
    }

    def loadCustomData(String canvasUserId, String scope){
        def resp = restClient.get(canvasBaseURL + '/api/v1/users/' + canvasUserId + '/custom_data/signup/' + scope + "?ns=${customDataNS}"){
            auth('Bearer ' + oauthToken)
        }
        String data = resp.json.data
        if(data){
            return data.tokenize('|')
        }
        return []
    }

    User getUserProfile(String userId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/users/' + userId + '/profile'){
            auth('Bearer ' + oauthToken)
        }
        User user = new User((JSONObject)resp.json)
        return user
    }
}
