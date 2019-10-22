import React, { Component } from 'react'
import ApplyTheme from '@instructure/ui-core/lib/components/ApplyTheme'
import Container from '@instructure/ui-core/lib/components/Container'
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import api from "../utils/api"
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import Loading from "./Loading"
import Badge from '@instructure/ui-core/lib/components/Badge'
import { Link } from "react-router-dom"
import Text from '@instructure/ui-core/lib/components/Text'
import Breadcrumb, {BreadcrumbLink} from '@instructure/ui-core/lib/components/Breadcrumb'
import Button from "@instructure/ui-core/lib/components/Button"
import IconTrashLine from 'instructure-icons/lib/Line/IconTrashLine'
import IconTroubleLine from 'instructure-icons/lib/Line/IconTroubleLine'
import Table from '@instructure/ui-core/lib/components/Table'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Heading from '@instructure/ui-core/lib/components/Heading'
import Alert from '@instructure/ui-core/lib/components/Alert'
import moment from "moment";
import IconCalendarReservedLine from 'instructure-icons/lib/Line/IconCalendarReservedLine'
import Tooltip from '@instructure/ui-core/lib/components/Tooltip'
import Pill from '@instructure/ui-core/lib/components/Pill'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import ManageReservationsModal from "./ManageReservations";
import ParticipantSummaryModal from "./ParticipantSummary";

function TimeSlotTable(props){
    const rows = [];
    let lastDate = null;
    props.apptGroup.appointments.forEach((appt) => {
        const currDate = moment(appt.start_at);
        if(lastDate == null || !currDate.isSame(lastDate,'day')){
            rows.push(<TimeSlotDateRow key={currDate.format()} date={currDate.tz(props.userTimezone).format("MMMM D, YYYY")}/>);
        }
        rows.push(
            <TimeSlotRow
                key={appt.id}
                appt={appt}
                onApptDeleteClick={props.onApptDeleteClick}
                onApptDeletion={props.onApptDeletion}
                onSlotReserve={props.onSlotReserve}
                onSlotUnreserve={props.onSlotUnreserve}
                onManageReservationsClick={props.onManageReservationsClick}
                userTimezone={props.userTimezone}
            />);
        lastDate = currDate;
    });

    return(
        <Table
            caption={<ScreenReaderContent>My Appointment Groups</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th scope="col">Start Time</th>
                <th scope="col">Status</th>
                <th scope="col">Participants</th>
                <th width="1"/>
            </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
        </Table>
    )
}

function TimeSlotRow(props){
    const appt = props.appt;
    let status = <StatusPill variant="success" text="Available"/>;
    if(appt.reserved){
        status = <StatusPill variant="primary" text="Reserved"/>
    }
    else if(appt.available_slots > 0){
        status = <StatusPill variant="success" text={`Available - ${appt.available_slots}/${appt.available_slots + appt.child_events_count}`}/>
    }
    else if(appt.available_slots === 0){
        status = <StatusPill variant="danger" text="Filled"/>
    }
    return(
        <tr>
            <td>{moment(appt.start_at).tz(props.userTimezone).format("h:mm a")}</td>
            <td>
                {status}
            </td>
            <td><Badge standalone count={appt.child_events_count}/></td>
            <td style={{whiteSpace: "nowrap"}}>
                <TimeSlotOptionsRow
                    appt={appt}
                    onApptDeleteClick={props.onApptDeleteClick}
                    onApptDeletion={props.onApptDeletion}
                    onSlotReserve={props.onSlotReserve}
                    onSlotUnreserve={props.onSlotUnreserve}
                    onManageReservationsClick={props.onManageReservationsClick}
                />
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

function TimeSlotOptionsRow(props){
    const icons = [];
    const appt = props.appt;
    if(appt.can_manage_appointment_group){
        icons.push(<ManageReservationsIcon key="manage" appt={appt} onManageReservationsClick={props.onManageReservationsClick}/>);
        icons.push(
            <DeleteSlotIcon
                key="delete"
                appt={appt}
                onApptDeleteClick={props.onApptDeleteClick}
                onApptDeletion={props.onApptDeletion}
        />);
    }
    else{
        if(appt.reserved){
            icons.push(<UnreserveIcon key="unreserve" appt={appt} onSlotUnreserve={props.onSlotUnreserve}/>);
        }
        else if(!appt.available_slots || appt.available_slots > 0){
            icons.push(<ReserveIcon key="reserve" appt={appt} onSlotReserve={props.onSlotReserve.bind(this,appt)}/>);
        }
    }
    return(
        <div>
        {icons}
        </div>
    )
}

function StatusPill(props){
    return(
        <Pill
            variant={props.variant}
            text={props.text}
            margin="0"
        />
    )
}

function ManageReservationsIcon(props){
    return(
        <Tooltip tip="Manage Reservations">
            <Button variant="icon" margin="0 x-small 0 0" onClick={props.onManageReservationsClick.bind(this,props.appt)}>
                <IconCalendarReservedLine title="Manage" />
            </Button>
        </Tooltip>
    )
}

function ReserveIcon(props){
    return(
        <Tooltip tip="Reserve">
            <Button variant="icon" margin="0 x-small 0 0" onClick={props.onSlotReserve.bind(this,props.appt.id, null, '')}>
                <IconCalendarReservedLine title="Reserve" />
            </Button>
        </Tooltip>
    )
}

function UnreserveIcon(props){
    const reservationId = props.appt.child_events.find(childEvent => childEvent.own_reservation).id;
    return(
        <Tooltip tip="Unreserve">
            <Button variant="icon" margin="0 x-small 0 0" onClick={props.onSlotUnreserve.bind(this,props.appt,reservationId)}>
                <IconTroubleLine title="Unreserve" />
            </Button>
        </Tooltip>
    )
}

function DeleteSlotIcon(props){
    return(
        <Tooltip tip="Delete">
            <Button
                variant="icon"
                margin="0 x-small 0 0"
                onClick={props.onApptDeleteClick.bind(this,props.appt)}
            >
                <IconTrashLine title="Delete" />
            </Button>
        </Tooltip>
    )
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

class TimeSlotHome extends Component {
    constructor() {
        super();

        this.state = {
            apptGroup: null,
            masterApptGroup: null,
            participants: null,
            attachments: null,
            showAlert: false,
            alertMessage: '',
            alertType: '',
            isLoading: true,
            showManageReservations: false,
            appt: null,
            showParticipantSummary: false,
            showConfirmDeleteModalWithComments: false,
            showConfirmReserveModalWithComments: false,
            showConfirmUnreserveModalWithComments: false,
            comments: '',
            targetAppt: {},
            targetParticipantId: null,
            targetReservationId: null,
            userTimezone: null
        };

        this.handleApptChange = this.handleApptChange.bind(this);
        this.handleDeleteAppt = this.handleDeleteAppt.bind(this);
        this.handleReserveAppt = this.handleReserveAppt.bind(this);
        this.handleUnreserveAppt = this.handleUnreserveAppt.bind(this);
        this.handleManageReservationsModalDismiss = this.handleManageReservationsModalDismiss.bind(this);
        this.handleManageReservationsIconClick = this.handleManageReservationsIconClick.bind(this);
        this.handleReserveForSubmit = this.handleReserveForSubmit.bind(this);
        this.handleParticipantSummaryClick = this.handleParticipantSummaryClick.bind(this);
        this.handleParticipantSummaryDismiss = this.handleParticipantSummaryDismiss.bind(this);
        this.handleConfirmSlotDelete = this.handleConfirmSlotDelete.bind(this);
        this.handleConfirmSlotDeleteDismiss = this.handleConfirmSlotDeleteDismiss.bind(this);
        this.handleCommentsChange = this.handleCommentsChange.bind(this);
        this.handleConfirmSlotReserve = this.handleConfirmSlotReserve.bind(this);
        this.handleConfirmSlotReserveDismiss = this.handleConfirmSlotReserveDismiss.bind(this);
        this.handleConfirmSlotUnreserve = this.handleConfirmSlotUnreserve.bind(this);
        this.handleConfirmSlotUnreserveDismiss = this.handleConfirmSlotUnreserveDismiss.bind(this);
    }

    handleApptChange(alertMessage, alertType){
        this.setState({isLoading: true});
        api.fetchSingleApptGroupDetails(this.state.apptGroup.id).then(function(data){
            this.setState({
                apptGroup: data.apptGroup,
                masterApptGroup: data.masterApptGroup,
                participants: data.apptGroupParticipants,
                attachments: data.apptAttachments,
                isLoading: false,
                alertType: alertType,
                alertMessage: alertMessage,
                showAlert: true,
                showManageReservations:false
            })
        }.bind(this));
        this.setState({showAlert: false});
    }

    handleDeleteAppt(apptId){
        this.setState({isLoading: true});
        api.deleteSingleAppt(apptId, this.state.comments).then(function(response){
            this.handleApptChange('Appointment Deleted','success');
        }.bind(this));
        this.setState({
            showConfirm: false,
            showConfirmDeleteModalWithComments: false
        });
    }

    handleReserveAppt(apptId, participantId, comments){
        this.setState({isLoading: true});
        api.reserveApptSlot(apptId, participantId, comments).then(function(response){
            this.handleApptChange('Appointment Slot Reserved','success');
        }.bind(this)).catch(function (error) {
            this.setState({
                alertType: 'error',
                alertMessage: error.response.data.errorMessage,
                showAlert: true,
                isLoading: false
            })
        }.bind(this));
        this.setState({
            showAlert: false,
            showConfirmReserveModalWithComments: false
        });
    }

    handleUnreserveAppt(apptId, reservationId, comments){
        this.setState({isLoading: true});
        api.unreserveApptSlot(apptId, reservationId, comments).then(function(response){
            this.handleApptChange('Appointment Slot Unreserved','success');
        }.bind(this)).catch(function (error) {
            this.setState({
                alertType: 'error',
                alertMessage: error.response.data.errorMessage,
                showAlert: true,
                isLoading: false,
                showManageReservations:false
            })
        }.bind(this));
        this.setState({
            showAlert: false,
            showConfirmUnreserveModalWithComments: false
        });
    }

    handleManageReservationsIconClick(appt){
        this.setState({
            showManageReservations: true,
            appt: appt
        })
    }

    handleManageReservationsModalDismiss(){
        this.setState({
            showManageReservations: false
        })
    }

    handleParticipantSummaryClick(appt){
        this.setState({
            showParticipantSummary: true
        })
    }

    handleParticipantSummaryDismiss(){
        this.setState({
            showParticipantSummary: false
        })
    }

    handleReserveForSubmit(apptId, participantId, comments){
        this.setState({isLoading: true});
        api.reserveApptSlot(apptId, participantId, comments).then(function(response){
            this.handleApptChange('Appointment Slot Reserved','success');
            this.handleManageReservationsModalDismiss();
        }.bind(this)).catch(function (error) {
            this.setState({
                alertType: 'error',
                alertMessage: error.response.data.errorMessage,
                showAlert: true,
                isLoading: false,
                showManageReservations: false
            })
        }.bind(this));
        this.setState({showAlert: false});
    }

    handleConfirmSlotDelete(appt){
        this.setState({
            showConfirmDeleteModalWithComments: true,
            targetAppt: appt
        })
    }

    handleConfirmSlotDeleteDismiss(){
        this.setState({
            showConfirmDeleteModalWithComments: false
        })
    }

    handleCommentsChange(e){
        this.setState({
            comments: e.target.value
        })
    }

    handleConfirmSlotReserve(appt){
        this.setState({
            showConfirmReserveModalWithComments: true,
            targetAppt: appt
        })
    }

    handleConfirmSlotReserveDismiss(){
        this.setState({
            showConfirmReserveModalWithComments: false
        })
    }

    handleConfirmSlotUnreserve(appt, reservationId){
        this.setState({
            showConfirmUnreserveModalWithComments: true,
            targetAppt: appt,
            targetReservationId: reservationId
        })
    }

    handleConfirmSlotUnreserveDismiss(){
        this.setState({
            showConfirmUnreserveModalWithComments: false
        })
    }

    componentDidMount() {
        const { apptGroupId } = this.props.match.params;
        api.fetchSingleApptGroupDetails(apptGroupId).then(function(data){
            this.setState({
                apptGroup: data.apptGroup,
                masterApptGroup: data.masterApptGroup,
                participants: data.apptGroupParticipants,
                attachments: data.apptAttachments,
                isLoading: false,
                userTimezone: data.timeZone
            })
        }.bind(this));
    }
    render() {
        return (
            <ApplyTheme theme={ApplyTheme.generateTheme('canvas', {
                    'ic-brand-primary': '#00356b',
                    'ic-brand-button--primary-bgd': '#00356b',
                    'ic-link-color': '#286dc0'
                }
            )}
            >
                <Container
                    as="div"
                    size="auto"
                    textAlign="start"
                    margin="small"
                >
                    <Loading isLoading={this.state.isLoading}/>
                    {this.state.apptGroup &&
                    <div>
                        <Grid vAlign="middle" colSpacing="none">
                            <div style={{borderBottom:"0.0625rem solid #C7CDD1", paddingBottom:"0.125rem"}}>
                                <GridRow>
                                    <GridCol>
                                        <Breadcrumb size="large" label="You are here:">
                                            <Link to="/signup"><BreadcrumbLink onClick={function () {}}>Sign Up BETA</BreadcrumbLink></Link>
                                            <BreadcrumbLink onClick={function () {}}>{this.state.apptGroup.title}</BreadcrumbLink>
                                        </Breadcrumb>
                                    </GridCol>
                                </GridRow>
                            </div>
                            {this.state.apptGroup.can_manage_appointment_group &&
                            <GridRow>
                                <GridCol>
                                    <Button margin="small 0 0 0" onClick={this.handleParticipantSummaryClick}>Participant Summary</Button>
                                </GridCol>
                            </GridRow>
                            }
                        </Grid>
                        <ConfirmModalWithComments
                            show={this.state.showConfirmDeleteModalWithComments}
                            onDismiss={this.handleConfirmSlotDeleteDismiss}
                            text="Are you sure you want to delete this appointment slot and any existing reservations?"
                            buttonText="Delete"
                            buttonType="danger"
                            title="Delete Appointment Slot"
                            commentLabel="Cancellation Reason"
                            confirmSubmitCallback={this.handleDeleteAppt.bind(this,this.state.targetAppt.id)}
                            onCommentsChange={this.handleCommentsChange}
                        />
                        <ConfirmModalWithComments
                            show={this.state.showConfirmReserveModalWithComments}
                            onDismiss={this.handleConfirmSlotReserveDismiss}
                            text=""
                            buttonText="Reserve"
                            buttonType="primary"
                            title="Reserve Slot"
                            commentLabel="Reservation Comments"
                            confirmSubmitCallback={this.handleReserveAppt.bind(this,this.state.targetAppt.id,this.state.targetParticipantId,this.state.comments)}
                            onCommentsChange={this.handleCommentsChange}
                        />
                        <ConfirmModalWithComments
                            show={this.state.showConfirmUnreserveModalWithComments}
                            onDismiss={this.handleConfirmSlotUnreserveDismiss}
                            text="Are you sure you want to cancel this reservation?"
                            buttonText="Unreserve"
                            buttonType="danger"
                            title="Cancel Reservation"
                            commentLabel="Cancellation Reason"
                            confirmSubmitCallback={this.handleUnreserveAppt.bind(this,this.state.targetAppt.id,this.state.targetReservationId,this.state.comments)}
                            onCommentsChange={this.handleCommentsChange}
                        />
                        <ManageReservationsModal
                            show={this.state.showManageReservations}
                            onDismiss={this.handleManageReservationsModalDismiss}
                            appt={this.state.appt}
                            apptGroup={this.state.apptGroup}
                            apptGroupParticipants={this.state.participants}
                            onReserveForSubmit={this.handleReserveForSubmit}
                            onSlotUnreserve={this.handleUnreserveAppt}
                            userTimezone={this.state.userTimezone}
                        />
                        <ParticipantSummaryModal show={this.state.showParticipantSummary} onDismiss={this.handleParticipantSummaryDismiss} apptGroup={this.state.apptGroup} userTimezone={this.state.userTimezone}/>
                        {this.state.showAlert &&
                        <Alert
                            variant={this.state.alertType}
                            margin="small"
                            timeout={5000}
                        >
                            {this.state.alertMessage}
                        </Alert>
                        }
                        <TimeSlotTable
                            apptGroup={this.state.apptGroup}
                            onApptDeleteClick={this.handleConfirmSlotDelete}
                            onApptDeletion={this.handleDeleteAppt}
                            onSlotReserve={this.handleConfirmSlotReserve}
                            onSlotUnreserve={this.handleConfirmSlotUnreserve}
                            onManageReservationsClick={this.handleManageReservationsIconClick}
                            userTimezone={this.state.userTimezone}
                        />
                    </div>
                    }
                </Container>
            </ApplyTheme>
        );
    }
}

export default TimeSlotHome;