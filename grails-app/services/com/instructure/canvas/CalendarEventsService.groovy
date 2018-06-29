package com.instructure.canvas

import grails.gorm.transactions.Transactional
import org.grails.web.json.JSONArray
import org.grails.web.json.JSONObject

@Transactional
class CalendarEventsService extends CanvasAPIBaseService{

    def reserveTimeSlot(String canvasUserId, String comment, Long slotId){
        def resp = restClient.post(canvasBaseURL + '/api/v1/calendar_events/' + slotId + '/reservations?as_user_id=' + canvasUserId){
            auth('Bearer ' + oauthToken)
            json{
                comments = comment
            }
        }
        println resp.json
        println resp.status
        return resp
    }

    def reserveTimeSlotForUser(Long canvasUserId, String reserveComments, Long slotId){
        def resp = restClient.post(canvasBaseURL + '/api/v1/calendar_events/' + slotId + '/reservations/' + canvasUserId){
            auth('Bearer ' + oauthToken)
            json{
                comments = reserveComments
            }
        }
        return resp
    }

    def deleteCalendarEvent(reservationId, String comments){
        def resp = restClient.delete(canvasBaseURL + '/api/v1/calendar_events/' + reservationId){
            auth('Bearer ' + oauthToken)
            json{
                cancel_reason = comments
            }
        }
        return resp
    }

    def updateCalendarEvent(AppointmentForm apptForm, Long slotId){
        def resp = restClient.put(canvasBaseURL + '/api/v1/calendar_events/' + slotId){
            auth('Bearer ' + oauthToken)
            contentType('application/x-www-form-urlencoded')
            body(apptForm.form)
        }
        println resp.json
        return resp
    }

    CalendarEvent getCalendarEvent(String calendarEventId, String canvasUserId){
        def resp = restClient.get(canvasBaseURL + '/api/v1/calendar_events/' + calendarEventId + '?as_user_id=' + canvasUserId){
            auth('Bearer ' + oauthToken)
        }
        CalendarEvent appt = new CalendarEvent((JSONObject)resp.json)
        return appt
    }

    List<CalendarEvent> listCalendarEventsForUser(String canvasUserId, String startDate, String endDate){
        def resp = restClient.get(canvasBaseURL + '/api/v1/users/' + canvasUserId + '/calendar_events?' + 'start_date=' + startDate + '&end_date=' + endDate){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<CalendarEvent> resultList = new ArrayList<CalendarEvent>(respArr)
        processResponsePages(resp,resultList)
        return resultList
    }

    List<CalendarEvent> listCalendarEventsForCurrentUser(String canvasUserId, String startDate, String endDate, String contextCodes){
        def url = "${canvasBaseURL}/api/v1/calendar_events?as_user_id=${canvasUserId}&${contextCodes}&end_date=${endDate}"
        def resp = restClient.get(url){
            auth('Bearer ' + oauthToken)
        }
        JSONArray respArr = (JSONArray) resp.json
        List<CalendarEvent> resultList = new ArrayList<CalendarEvent>(respArr)
        processResponsePages(resp,resultList)
        return resultList
    }
}
