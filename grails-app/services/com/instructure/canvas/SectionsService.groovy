package com.instructure.canvas

import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray

@Transactional
class SectionsService extends CanvasAPIBaseService {

    List<Section> listCourseSections(Long courseId) {
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + '/sections'){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<Section> resultList = new ArrayList<Section>(respArr)
        processResponsePages(resp,resultList)
        return resultList
    }
}
