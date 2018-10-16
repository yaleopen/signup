package com.instructure.canvas

class Course {

    Long id
    String name
    String enrollment_term_id
    String sis_course_id
    String sis_import_id
    String uuid
    String integration_id
    String course_code
    String workflow_state
    Long account_id
    Long root_account_id
    String start_at
    String end_at
    String created_at
    String locale
    List enrollments
    Boolean restrict_enrollments_to_course_dates
    String time_zone
    Boolean apply_assignment_group_weights
    Boolean hide_final_grades
    Boolean is_public_to_auth_users
    Boolean is_public
    Long storage_quota_mb
    Boolean public_syllabus_to_auth
    Boolean public_syllabus
    String default_view
    Long grading_standard_id
    List<Section> sections
    List<GroupCategory> groupCategories
    def calendar
    Boolean blueprint
    def blueprint_restrictions
    def blueprint_restrictions_by_object_type

}
