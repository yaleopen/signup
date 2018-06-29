package com.instructure.canvas

import grails.validation.Validateable
import org.springframework.web.multipart.MultipartFile
import signup.tool.NotificationPreference

import java.text.SimpleDateFormat

class AppointmentGroup implements Validateable{

    Long id
    String title
    String start_at
    String end_at
    String description
    String location_name
    String location_address
    Integer participant_count
    List<Appointment> reserved_times
    List<String> context_codes
    List<String> sub_context_codes
    String workflow_state
    Boolean requiring_action
    Integer appointments_count
    List<Appointment> appointments
    List<Appointment> new_appointments
    List<String> new_appointments_delimited
    Integer max_appointments_per_participant
    Integer min_appointments_per_participant
    Integer participants_per_appointment
    String participant_visibility
    String participant_type
    String url
    String html_url
    String created_at
    String updated_at
    Boolean publish
    Boolean isPublished
    Boolean can_manage_appointment_group
    List<NotificationPreference> enabledNotificationPreferences
    List<NotificationPreference> disabledNotificationPreferences
    List<MultipartFile> newAttachments
    List<File> existingAttachments
    List<Course> courses
    List participants

    Map<String,List<Appointment>> getApptMapByDate(){
        Map<String,List<Appointment>> apptDateMap = new TreeMap<String,List<Appointment>>()
        for(appt in appointments){
            def utcFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ")
            def dateOnlyFormat = new SimpleDateFormat("yyyy-MM-dd")
            def formattedDate = utcFormat.parse(appt.start_at.replaceAll("Z", "+0400"))
            def inDST = TimeZone.getTimeZone("America/New_York").inDaylightTime(formattedDate)
            if(inDST){
                formattedDate = utcFormat.parse(appt.start_at.replaceAll("Z", "+0500"))
            }
            String apptDate = dateOnlyFormat.format(formattedDate)
            if(apptDateMap.containsKey(apptDate)){
                apptDateMap.get(apptDate).add(appt)
            }
            else{
                List<Appointment> apptDateList = new ArrayList<>([appt])
                apptDateMap.put(apptDate, apptDateList)
            }
        }
        return apptDateMap
    }

    static constraints = {
        title blank: false
    }

}
