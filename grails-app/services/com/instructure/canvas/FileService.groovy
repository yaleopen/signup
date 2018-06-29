package com.instructure.canvas

import grails.plugins.rest.client.RestResponse
import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray
import org.grails.web.json.JSONObject
import org.springframework.core.io.InputStreamResource
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.multipart.MultipartFile

@Transactional
class FileService extends CanvasAPIBaseService {

    private def notifyCanvas(String fileName, Boolean uploadAsLocked, String courseId, String userId, String apptGroupId) {
        def resp = restClient.post(canvasBaseURL + '/api/v1/courses/' + courseId + '/files?as_user_id=' + userId){
            auth('Bearer ' + oauthToken)
            json{
                name = fileName
                parent_folder_path = "signup/${apptGroupId}"
                locked = uploadAsLocked
            }
        }
        return resp
    }

    private def awsUpload(uploadParams, MultipartFile multipartFile) {
        String uploadUrl = uploadParams.json.upload_url
        JSONObject params = uploadParams.json.upload_params
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<String, Object>()
        params.each {k,v ->
            form.add(k.toString(),v)
        }
        form.add("file", new InputStreamResource(multipartFile.getInputStream()))
        def resp = restClient.post(uploadUrl){
            contentType "multipart/form-data"
            body(form)
        }
        return resp
    }

    def upload(MultipartFile multipartFile, Boolean uploadAsLocked, String courseId, String fileTitle, String userId, String apptGroupId){
        createFolder('signup',courseId)
        def uploadParams = notifyCanvas(fileTitle, uploadAsLocked, courseId, userId, apptGroupId)
        def awsUploadResponse = awsUpload(uploadParams, multipartFile)
        def resp = restClient.post(awsUploadResponse.headers.getLocation().toString()){
            auth('Bearer ' + oauthToken)
        }
        String fileId = resp.json.id
        hideFile(fileId, true)
    }

    def listFiles(String courseId, String apptGroupId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + "/folders/by_path/signup/${apptGroupId}"){
            auth('Bearer ' + oauthToken)
        }
        if(resp.status != 200){
            return []
        }
        JSONArray respArr = (JSONArray)resp.json
        def folderId = -1
        for(jsonObj in respArr){
            if(jsonObj.name == "${apptGroupId}"){
                folderId = jsonObj.id
                break
            }
        }
        return fetchFiles(folderId)
    }

    def createFolder(String folderName, String courseId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + "/folders/by_path/${folderName}/"){
            auth('Bearer ' + oauthToken)
        }
        if(resp.status != 200){
            restClient.post(canvasBaseURL + '/api/v1/courses/' + courseId + '/folders'){
                auth('Bearer ' + oauthToken)
                json{
                    name = folderName
                    locked = true
                    parent_folder_path = '/'
                }
            }
        }
    }

    private def fetchFiles(Long folderId){
        List<File> fileList = new ArrayList<>()
        def resp = restClient.get(canvasBaseURL + '/api/v1/folders/' + folderId + '/files?include[]=user'){
            auth('Bearer ' + oauthToken)
        }
        populateFileList(resp, fileList)

        def nextPage = canvasNextPage(resp)
        while(nextPage != null){
            resp = restClient.get(nextPage){
                auth('Bearer ' + oauthToken)
            }
            populateFileList(resp, fileList)
            nextPage = canvasNextPage(resp)
        }

        return fileList
    }

    private static def populateFileList(RestResponse resp, List<File> fileList){
        JSONArray respArr = (JSONArray)resp.json
        for(jsonObj in respArr){
            File file = new File(fileId: jsonObj.id, displayName: jsonObj.display_name, fileName: jsonObj.filename, modifiedBy: jsonObj.user.display_name, updatedAt: Date.parse("yyyy-MM-dd'T'HH:mm:ss'Z'", (String)jsonObj.updated_at), locked: jsonObj.locked, hidden: jsonObj.hidden, url: jsonObj.url)
            fileList.add(file)
        }
    }

    def deleteFile(String fileId){
        restClient.delete(canvasBaseURL + '/api/v1/files/' + fileId){
            auth('Bearer ' + oauthToken)
        }
    }

    def hideFile(String fileId, Boolean hide){
        restClient.put(canvasBaseURL + '/api/v1/files/' + fileId){
            auth('Bearer ' + oauthToken)
            json{
                hidden = hide
            }
        }
    }

    def listUserLogins(String courseId){
        def users = []
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + '/users?enrollment_type[]=student&enrollment_state[]=active&per_page=100'){
            auth('Bearer ' + oauthToken)
        }
        populateUserLogins(resp, users)

        def nextPage = canvasNextPage(resp)
        while(nextPage != null){
            resp = restClient.get(nextPage){
                auth('Bearer ' + oauthToken)
            }
            populateUserLogins(resp, users)
            nextPage = canvasNextPage(resp)
        }

        return users
    }

    private static def populateUserLogins(RestResponse resp, users){
        JSONArray respArr = (JSONArray)resp.json
        for(jsonObj in respArr){
            users.add(jsonObj.login_id)
        }
    }

    def listUserDetails(String courseId){
        def users = []
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + '/users?enrollment_type[]=student&enrollment_state[]=active&per_page=100'){
            auth('Bearer ' + oauthToken)
        }
        populateUserDetails(resp, users)

        def nextPage = canvasNextPage(resp)
        while(nextPage != null){
            resp = restClient.get(nextPage){
                auth('Bearer ' + oauthToken)
            }
            populateUserDetails(resp, users)
            nextPage = canvasNextPage(resp)
        }

        return users
    }

    private static def populateUserDetails(RestResponse resp, users){
        JSONArray respArr = (JSONArray)resp.json
        for(jsonObj in respArr){
            String sortableName = jsonObj.sortable_name
            String[] splitName = sortableName.split(',')
            def user = [jsonObj.login_id, splitName[0].trim(), splitName[1].trim()]
            users.add(user)
        }
    }

    def canvasNextPage(RestResponse resp){
        String linkHeader = resp.headers.getFirst('Link')
        String nextLink = null
        if(linkHeader != null){
            String[] links = linkHeader.split(',')
            for(link in links){
                String[] linkParts = link.split(';')
                String relVal = linkParts[0]
                String relType = linkParts[1]
                if(relType.contains('next')){
                    nextLink = relVal.substring(1,relVal.length()-1)
                    break
                }
            }
        }
        if(nextLink){
            return URLDecoder.decode(nextLink,"UTF-8")
        }
        return nextLink
    }

    def updateFileName(String fileId, String fileName){
        restClient.put(canvasBaseURL + '/api/v1/files/' + fileId){
            auth('Bearer ' + oauthToken)
            json{
                name = fileName
                on_duplicate = 'rename'
            }
        }
    }

    def deleteFileWithName(String fileName, String courseId, String apptGroupId){
        def files = listFiles(courseId,apptGroupId)
        def file = files.find{it.displayName == fileName}
        deleteFile(file.fileId as String)
    }

    def deleteFolderByApptGroupId(String apptGroupId, String courseId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/courses/' + courseId + "/folders/by_path/signup/${apptGroupId}"){
            auth('Bearer ' + oauthToken)
        }
        if(resp.status != 200){
            return
        }
        JSONArray respArr = (JSONArray)resp.json
        def folderId = -1
        for(jsonObj in respArr){
            if(jsonObj.name == "${apptGroupId}"){
                folderId = jsonObj.id
                break
            }
        }
        restClient.delete("${canvasBaseURL}/api/v1/folders/${folderId}?force=true"){
            auth('Bearer ' + oauthToken)
        }
    }
}
