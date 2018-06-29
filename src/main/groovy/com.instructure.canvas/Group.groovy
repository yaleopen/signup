package com.instructure.canvas

class Group {
    Long id
    String name
    String description
    Boolean is_public
    Boolean followed_by_user
    String join_level
    Integer members_count
    String avatar_url
    String context_type
    Long course_id
    String role
    Long group_category_id
    String sis_group_id
    Long sis_import_id
    Long storage_quota_mb
    String leader
    Boolean has_submission
    Boolean concluded
    Integer max_membership
    List<User> groupUsers
}
