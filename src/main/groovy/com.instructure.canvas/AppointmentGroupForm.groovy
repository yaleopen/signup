package com.instructure.canvas

import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap

/**
 * Created by iao4 on 7/14/17.
 */
class AppointmentGroupForm {
    MultiValueMap<String, String> form
    def timeSlotCount
    def apptGroupParamMapping = [
            context_codes :  'appointment_group[context_codes][]',
            sub_context_codes :  'appointment_group[sub_context_codes][]',
            title : 'appointment_group[title]',
            description : 'appointment_group[description]',
            location_name : 'appointment_group[location_name]',
            location_address : 'appointment_group[location_address]',
            participants_per_appointment : 'appointment_group[participants_per_appointment]',
            min_appointments_per_participant : 'appointment_group[min_appointments_per_participant]',
            max_appointments_per_participant : 'appointment_group[max_appointments_per_participant]',
            participant_visibility : 'appointment_group[participant_visibility]'
    ]

    AppointmentGroupForm(){
        form = new LinkedMultiValueMap<String, String>()
        timeSlotCount = 0
    }

    AppointmentGroupForm(timeSlotCount){
        form = new LinkedMultiValueMap<String, String>()
        this.timeSlotCount = timeSlotCount
    }

    void setForm(AppointmentGroup apptGroup, Boolean isPublished) {
        apptGroupParamMapping.each {entry ->
            def apptGroupParam = apptGroup.getProperty("${entry.key}")
            if(apptGroupParam && apptGroupParam instanceof List){
                for(param in apptGroupParam){
                    form.add(entry.value, param as String)
                }
            }
            else if(apptGroupParam){
                form.add(entry.value, apptGroupParam as String)
            }
            else if(apptGroupParam == 0){
                form.add(entry.value, null)
            }
        }
        if(apptGroup.workflow_state != 'active'){
            form.add('appointment_group[publish]', isPublished ? '1' : '0')
        }
    }

    void addTimeSlot(String start, String end){
        form.add("appointment_group[new_appointments][" + timeSlotCount + "][]", start)
        form.add("appointment_group[new_appointments][" + timeSlotCount + "][]", end)
        timeSlotCount++
    }
}
