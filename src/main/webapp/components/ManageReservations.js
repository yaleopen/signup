import React, {Component} from 'react';
import Button from "@instructure/ui-core/lib/components/Button"
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import Heading from '@instructure/ui-core/lib/components/Heading'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Select from '@instructure/ui-core/lib/components/Select'
import Table from '@instructure/ui-core/lib/components/Table'
import Text from '@instructure/ui-core/lib/components/Text'
import Tooltip from '@instructure/ui-core/lib/components/Tooltip'
import IconXLine from 'instructure-icons/lib/Line/IconXLine'
import Alert from '@instructure/ui-core/lib/components/Alert'
import moment from "moment"

class ReservationForm extends Component{
    constructor(props){
        super(props);
        this.state = {
            unreservedParticipants: this.props.appt ? this.filterUnreservedParticipants(this.props.appt,this.props.apptGroupParticipants) : [],
            selectedParticipantId: 'default',
            reservationComment: '',
            showConfirmUnreserveModalWithComments: false,
            targetReservationId: null,
            comments: ''
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSelectedParticipantChange = this.handleSelectedParticipantChange.bind(this);
        this.handleTextInputChange = this.handleTextInputChange.bind(this);
        this.handleConfirmSlotUnreserve = this.handleConfirmSlotUnreserve.bind(this);
        this.handleConfirmSlotUnreserveDismiss = this.handleConfirmSlotUnreserveDismiss.bind(this);
        this.handleCommentsChange = this.handleCommentsChange.bind(this);
    }

    filterUnreservedParticipants(appt, apptGroupParticipants){
        const reservedParticipants = appt.child_events.reduce(function(accumulator, currentValue) {
            if(appt.participant_type === 'User'){
                return accumulator.concat(currentValue.user.id)
            }
            else if(appt.participant_type === 'Group'){
                return accumulator.concat(currentValue.group.id)
            }
        }, []);
        return apptGroupParticipants.filter(participant => !reservedParticipants.includes(participant.id));
    }

    handleTextInputChange(event){
        const target = event.target;
        this.setState({
            [target.name]: target.value
        })
    }

    handleSelectedParticipantChange(e){
        this.setState({
            selectedParticipantId: e.target.value,
        })
    }

    handleConfirmSlotUnreserve(reservationId){
        this.setState({
            showConfirmUnreserveModalWithComments: true,
            targetReservationId: reservationId
        })
    }

    handleConfirmSlotUnreserveDismiss(){
        this.setState({
            showConfirmUnreserveModalWithComments: false
        })
    }

    handleCommentsChange(e){
        this.setState({
            comments: e.target.value
        })
    }

    handleSubmit(e) {
        e.preventDefault();
        const { selectedParticipantId, reservationComment } = this.state;
        const apptId = this.props.appt.id;
        this.props.onReserveForSubmit(apptId,selectedParticipantId,reservationComment);
    }

    render(){
        return(
            <form onSubmit={this.handleSubmit}>
                <ConfirmModalWithComments
                    show={this.state.showConfirmUnreserveModalWithComments}
                    onDismiss={this.handleConfirmSlotUnreserveDismiss}
                    text="Are you sure you want to cancel this reservation?"
                    buttonText="Unreserve"
                    buttonType="danger"
                    title="Cancel Reservation"
                    commentLabel="Cancellation Reason"
                    confirmSubmitCallback={this.props.onSlotUnreserve.bind(this,this.props.appt.id,this.state.targetReservationId,this.state.comments)}
                    onCommentsChange={this.handleCommentsChange}
                />
                <Grid colSpacing="large" rowSpacing="small">
                    {!this.props.apptGroup.isPublished &&
                    <GridRow>
                        <GridCol>
                            <Alert
                                variant="warning"
                                margin="0"
                            >
                                Appointment Group must be published before making a reservation
                            </Alert>
                        </GridCol>
                    </GridRow>
                    }
                    {this.state.unreservedParticipants.length > 0 &&
                    <GridRow>
                        <GridCol>
                            <SelectParticipants
                                unreservedParticipants={this.state.unreservedParticipants}
                                onSelectedParticipantChange={this.handleSelectedParticipantChange}
                                selectedParticipantId={this.state.selectedParticipantId}
                            />
                        </GridCol>
                        <GridCol>
                            <TextInput
                                name="reservationComment"
                                onChange={this.handleTextInputChange}
                                value={this.state.reservationComment}
                                label="Reservation Comments"
                            />
                        </GridCol>
                    </GridRow>
                    }
                    {this.props.appt.child_events_count > 0 &&
                    <GridRow>
                        <GridCol>
                            <ReservationTable
                                reservations={this.props.appt.child_events}
                                onSlotUnreserve={this.handleConfirmSlotUnreserve}
                                apptId={this.props.appt.id}
                            />
                        </GridCol>
                    </GridRow>
                    }
                    <GridRow>
                        <GridCol>
                            <ModalFooter>
                                <Button disabled={this.state.unreservedParticipants.length === 0 || !this.props.apptGroup.isPublished} type="submit" variant="primary">Reserve</Button>
                            </ModalFooter>
                        </GridCol>
                    </GridRow>
                </Grid>
            </form>
        )
    }
}

function ConfirmModalWithComments(props){
    return(
        <Modal
            open={props.show}
            onDismiss={props.onDismiss}
            size='small'
            label='Modal Dialog: Confirm'
            shouldCloseOnOverlayClick={false}
            closeButtonLabel="Close"
            applicationElement={() => document.getElementById('root') }
        >
            <ModalHeader>
                <Heading level="h3">{props.title}</Heading>
            </ModalHeader>
            <ModalBody>
                <Grid vAlign="middle" colSpacing="none">
                    <GridRow>
                        <GridCol>
                            <Text>{props.text}</Text>
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <TextInput label={props.commentLabel} onChange={props.onCommentsChange}/>
                        </GridCol>
                    </GridRow>
                </Grid>
            </ModalBody>
            <ModalFooter>
                <Button onClick={props.confirmSubmitCallback} variant={props.buttonType}>{props.buttonText}</Button>
            </ModalFooter>
        </Modal>
    )
}

function ReservationTable(props){
    return(
        <Table
            caption={<ScreenReaderContent>Reservations</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th scope="col">Participant</th>
                <th scope="Comments">Comments</th>
                <th width="1"/>
            </tr>
            </thead>
            <tbody>
            {props.reservations.map((reservation) =>
                <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                    onSlotUnreserve={props.onSlotUnreserve}
                    apptId={props.apptId}
                />
            )}
            </tbody>
        </Table>
    )
}

function ReservationRow(props){
    const reservation = props.reservation;
    return(
        <tr>
            <td>
                {reservation.participant_type === 'User' ?
                    <Text>{reservation.user.name}</Text> :
                    <Text>{reservation.group.name}</Text>
                }
            </td>
            <td>
                <Text>{reservation.comments}</Text>
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <Tooltip tip="Unreserve">
                    <Button variant="icon" margin="0" onClick={props.onSlotUnreserve.bind(this,reservation.id)}>
                        <IconXLine title="Unreserve" />
                    </Button>
                </Tooltip>
            </td>
        </tr>
    )
}

function SelectParticipants(props){
    const options = [<option key='default' value='default'> </option>];
    props.unreservedParticipants.map((participant)=>
        options.push(<option key={participant.id} value={participant.id}>{participant.name}</option>)
    );
    return(
        <Select
                label="Reserve For"
                onChange={props.onSelectedParticipantChange}
                value={props.selectedParticipantId}
        >
            {options}
        </Select>
    )
}

function ManageReservationsModal(props) {
    return(
        <div style={{padding: "5px"}}>
            <Modal
                open={props.show}
                onDismiss={props.onDismiss}
                size='medium'
                label='Modal Dialog: Manage Reservations'
                shouldCloseOnOverlayClick={false}
                closeButtonLabel="Close"
                applicationElement={() => document.getElementById('root') }
            >
                <ModalHeader>
                    <Heading level="h3">{props.appt ? moment(props.appt.start_at).tz(props.userTimezone).format("MMM D, YYYY h:mm a - ") + moment(props.appt.end_at).tz(props.userTimezone).format("h:mm a") : ' '}</Heading>
                </ModalHeader>
                <ModalBody>
                    <ReservationForm
                        onDismiss={props.onDismiss}
                        appt={props.appt}
                        apptGroupParticipants={props.apptGroupParticipants}
                        onReserveForSubmit={props.onReserveForSubmit}
                        onSlotUnreserve={props.onSlotUnreserve}
                        apptGroup={props.apptGroup}
                    />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ManageReservationsModal;