package com.instructure.canvas

import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray
import org.grails.web.json.JSONObject

@Transactional
class GroupsService extends CanvasAPIBaseService {

    def listGroupCategoriesForCourse(Long courseId) {
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + '/group_categories'){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<GroupCategory> resultList = new ArrayList<GroupCategory>(respArr)
        return resultList
    }

    List<User> listGroupUsers(Long groupId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/groups/' + groupId + '/users?include[]=email'){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<User> resultList = new ArrayList<User>(respArr)
        return resultList
    }

    Group getSingleGroup(Long groupId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/groups/' + groupId){
            auth('Bearer ' + oauthToken)
        }
        Group group = new Group((JSONObject)resp.json)
        return group
    }

    List<Group> listUsersGroups(String canvasUserId){
        def resp = restClient.get(canvasBaseURL + "/api/v1/users/self/groups?as_user_id=${canvasUserId}"){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<Group> resultList = new ArrayList<Group>(respArr)
        return resultList
    }
}
