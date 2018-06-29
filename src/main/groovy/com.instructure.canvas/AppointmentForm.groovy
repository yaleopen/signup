package com.instructure.canvas

import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap

class AppointmentForm {
    MultiValueMap<String, String> form
    def apptParamMapping = [
            start_at: 'calendar_event[start_at]',
            end_at: 'calendar_event[end_at]',
            description :  'calendar_event[description]',
            participants_per_appointment :  'calendar_event[participants_per_appointment]'
    ]

    AppointmentForm(){
        form = new LinkedMultiValueMap<String, String>()
    }

    void setForm(Appointment appt) {
        apptParamMapping.each { entry ->
            def apptParam = appt.getProperty("${entry.key}")
            if(apptParam && apptParam instanceof List){
                for(param in apptParam){
                    form.add(entry.value, param as String)
                }
            }
            else if(apptParam){
                form.add(entry.value, apptParam as String)
            }
        }
    }
}
