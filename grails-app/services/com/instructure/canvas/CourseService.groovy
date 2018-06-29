package com.instructure.canvas

import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray
import org.grails.web.json.JSONObject
import org.springframework.beans.factory.annotation.Value

import java.text.SimpleDateFormat

@Transactional
class CourseService extends CanvasAPIBaseService{

    def enrollmentTermService
    def groupsService
    def sectionsService
    @Value('${canvas.manageCalendarRoles}')
    String manageCalendarRoles

    List<Course> listCourses(String canvasUserId){
        def roleList = manageCalendarRoles.tokenize(',')
        List<Course> resultList = new ArrayList<Course>()
        for(roleId in roleList){
            def resp = restClient.get(canvasBaseURL + '/api/v1/courses?as_user_id=' + canvasUserId + '&enrollment_role_id=' + roleId){
                auth('Bearer ' + oauthToken)
            }
            JSONArray respArr = (JSONArray) resp.json
            resultList.addAll(respArr)
            processResponsePages(resp,resultList)
        }
        //remove duplicate courses
        resultList.unique { course ->
            course.id
        }

        //filter only courses in active terms and check start/end dates to remove completed courses
        def activeTerms = enrollmentTermService.listActiveTerms()
        def utcFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ")
        resultList.retainAll{
                    activeTerms.contains(it.enrollment_term_id) &&
                    (it.start_at ? utcFormat.parse(it.start_at.replaceAll("Z", "+0000")).before(new Date()) : true) &&
                    (it.end_at ? utcFormat.parse(it.end_at.replaceAll("Z", "+0000")).after(new Date()) : true)
        }

        //add groups and sections
        resultList.each { course ->
            def groupCategories = groupsService.listGroupCategoriesForCourse(course.id)
            def sections = sectionsService.listCourseSections(course.id)
            if(groupCategories){
                course.groupCategories = new ArrayList<GroupCategory>(groupCategories)
            }
            if(sections){
                course.sections = new ArrayList<Section>(sections)
            }
        }
        return resultList
    }

    List<Course> listCoursesAsStudent(String canvasUserId){
        List<Course> resultList = new ArrayList<Course>()
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses?as_user_id=' + canvasUserId + '&enrollment_type=student'){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        resultList.addAll(respArr)
        processResponsePages(resp,resultList)
        //remove duplicate courses
        resultList.unique { course ->
            course.id
        }

        //filter only courses in active terms
        def activeTerms = enrollmentTermService.listActiveTerms()
        resultList.retainAll{
            activeTerms.contains(it.enrollment_term_id)
        }

        return resultList
    }

    List<User> listSelectUsersInCourse(String courseId, List<String> userIds){
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + '/users?' + userIds.join('&') + '&include[]=email'){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<User> resultList = new ArrayList<User>(respArr)
        processResponsePages(resp,resultList)
        return resultList
    }

    List<User> listManagedUsersInCourse(String courseId){
        def roleList = manageCalendarRoles.tokenize(',')
        def enrollmentParamString = new StringBuilder()
        roleList.each{
            enrollmentParamString.append("&enrollment_role_id[]=${it}")
        }
        def resp = restClient.get("${canvasBaseURL}/api/v1/courses/${courseId}/users?include[]=email&include[]=enrollments${enrollmentParamString.toString()}"){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<User> resultList = new ArrayList<User>(respArr)
        processResponsePages(resp,resultList)
        resultList.removeAll{it.enrollments.get(0) && it.enrollments.get(0).limit_privileges_to_course_section}
        return resultList
    }

    Course getSingleCourse(String courseId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId){
            auth('Bearer ' + oauthToken)
        }
        Course course = new Course((JSONObject)resp.json)
        return course
    }
}
