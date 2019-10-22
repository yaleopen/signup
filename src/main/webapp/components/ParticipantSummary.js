import React from 'react';
import Button from "@instructure/ui-core/lib/components/Button"
import Heading from '@instructure/ui-core/lib/components/Heading'
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Table from '@instructure/ui-core/lib/components/Table'
import IconDownloadLine from 'instructure-icons/lib/Line/IconDownloadLine'
import moment from "moment";
import Tooltip from '@instructure/ui-core/lib/components/Tooltip'

function ParticipantSummaryTable(props){
    const rows = [];
    let lastDate = null;
    props.apptGroup.appointments.forEach((appt) => {
        const currDate = moment(appt.start_at);
        if(lastDate == null || !currDate.isSame(lastDate,'day')){
            rows.push(<TimeSlotDateRow key={currDate.format()} date={currDate.tz(props.userTimezone).format("MMMM D, YYYY")}/>);
        }
        appt.child_events.forEach((slot) => {
            rows.push(
                <ParticipantSummaryRow
                    key={slot.id}
                    slot={slot}
                    courses={props.apptGroup.courses}
                    userTimezone={props.userTimezone}
                />);
        });
        lastDate = currDate;
    });
    return(
        <Table
            caption={<ScreenReaderContent>My Appointment Groups</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th scope="col">Start Time</th>
                <th scope="col">Calendar</th>
                <th scope="col">Participant</th>
            </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
        </Table>
    )
}

function ParticipantSummaryRow(props){
    const slot = props.slot;
    const courseId = slot.participant_type === 'User' ? slot.effective_context_code.split('_')[1] : slot.group.course_id;
    const course = props.courses.find( course => course.id.toString() === courseId.toString());
    const groupMembers = [];
    if(slot.participant_type === 'Group'){
        slot.group.users.forEach((user)=>groupMembers.push(user.name))
    }
    return(
        <tr>
            <td>{moment(slot.start_at).tz(props.userTimezone).format("h:mm a")}</td>
            <td>
                {course.name}
            </td>
            <td>
            {
                slot.participant_type === 'User' ? slot.user.name :
                    <Tooltip tip={groupMembers.join()}>
                        {slot.group.name}
                    </Tooltip>
            }
            </td>
        </tr>
    )
}

function TimeSlotDateRow(props){
    return(
        <tr style={{backgroundColor:"#F5F5F5"}}>
            <th colSpan="4" style={{textAlign:"center"}}>
                {props.date}
            </th>
        </tr>
    )
}


function ParticipantSummaryModal(props) {
    return(
        <div style={{padding: "5px"}}>
            <Modal
                open={props.show}
                onDismiss={props.onDismiss}
                size='medium'
                label='Modal Dialog: Participant Summary'
                shouldCloseOnOverlayClick={false}
                closeButtonLabel="Close"
                applicationElement={() => document.getElementById('root') }
            >
                <ModalHeader>
                    <Heading level="h3">Participant Summary</Heading>
                </ModalHeader>
                <ModalBody>
                    <ParticipantSummaryTable apptGroup={props.apptGroup} userTimezone={props.userTimezone}/>
                </ModalBody>
                <ModalFooter>
                    <Button href={`/signup/appointmentGroups/downloadParticipantSummary?apptGroupId=${props.apptGroup.id}`} variant="primary" margin="0">
                        <IconDownloadLine />
                        Download
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default ParticipantSummaryModal;