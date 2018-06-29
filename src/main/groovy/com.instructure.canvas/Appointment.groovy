package com.instructure.canvas

import grails.validation.Validateable

class Appointment implements Validateable {

    Long id
    String start_at
    String end_at
    Boolean can_manage_appointment_group
    List<CalendarEvent> child_events
    Integer available_slots
    Integer child_events_count
    Integer participants_per_appointment
    Long appointment_group_id
    String reserve_comments
    String comments
    Boolean reserved
    Long participantId
    String description
    String effective_context_code
    String appointment_group_url
    Boolean hidden
    String created_at
    String title
    String location_name
    String location_address
    String workflow_state
    String updated_at
    Boolean all_day
    String all_day_date
    String type
    String message
    String context_code
    String all_context_codes
    Long parent_event_id
    String participant_type
    String reserve_url
    User user
    Group group
    String url
    String html_url
    List<CalendarEvent> duplicates
    String attribute
    List<CalendarEvent> reservations

}
