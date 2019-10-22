import React, {Component} from 'react';
import Button from "@instructure/ui-core/lib/components/Button"
import { MenuItem } from '@instructure/ui-core/lib/components/Menu'
import PopoverMenu from '@instructure/ui-core/lib/components/PopoverMenu'
import IconEditLine from 'instructure-icons/lib/Line/IconEditLine'
import IconTrashLine from 'instructure-icons/lib/Line/IconTrashLine'
import IconEmailLine from 'instructure-icons/lib/Line/IconEmailLine'
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import Text from "@instructure/ui-core/lib/components/Text"
import IconCalendarMonthLine from 'instructure-icons/lib/Line/IconCalendarMonthLine'
import IconPublishLine from 'instructure-icons/lib/Line/IconPublishLine'
import Moment from 'react-moment'
import { Link } from "react-router-dom"
import Table from '@instructure/ui-core/lib/components/Table'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Popover, {PopoverContent, PopoverTrigger} from '@instructure/ui-core/lib/components/Popover'
import Heading from '@instructure/ui-core/lib/components/Heading'
import IconPaperclipLine from 'instructure-icons/lib/Line/IconPaperclipLine'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import Select from '@instructure/ui-core/lib/components/Select'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import moment from "moment"
import NewAppointmentGroupModal from "./NewApptGroup"
import Alert from '@instructure/ui-core/lib/components/Alert'
import EditAppointmentGroupModal from "./EditApptGroup"
import MessageStudentsModal from "./MessageStudents"
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import List, {ListItem} from '@instructure/ui-core/lib/components/List'
import RadioInputGroup from '@instructure/ui-core/lib/components/RadioInputGroup'
import RadioInput from '@instructure/ui-core/lib/components/RadioInput'
import Tooltip from '@instructure/ui-core/lib/components/Tooltip'
import Pill from '@instructure/ui-core/lib/components/Pill'

function SettingsList(props){
    return(
        <div>
            {props.apptGroup.can_manage_appointment_group &&
                <Popover placement="top">
                    <PopoverTrigger>
                        <Button onClick={props.onEditClick.bind(this,props.apptGroup)} variant="icon" margin="0 x-small 0 0">
                            <IconEditLine title="Edit"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent><Heading level="h4" margin="xx-small">Edit</Heading></PopoverContent>
                </Popover>
            }
            {props.apptGroup.can_manage_appointment_group &&
                <Popover placement="top">
                    <PopoverTrigger>
                        <Button onClick={props.onMessageIconClick.bind(this,props.apptGroup)} variant="icon" margin="0 x-small 0 0">
                            <IconEmailLine title="Message Students"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent><Heading level="h4" margin="xx-small">Message Students</Heading></PopoverContent>
                </Popover>
            }
            {props.apptGroup.can_manage_appointment_group &&
                <Popover placement="top">
                    <PopoverTrigger>
                        <Button onClick={props.onDeleteApptGroupClick.bind(this,props.apptGroup)} variant="icon" margin="0 x-small 0 0">
                            <IconTrashLine title="Delete"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent><Heading level="h4" margin="xx-small">Delete</Heading></PopoverContent>
                </Popover>
            }
            {props.apptGroup.existingAttachments &&
                <Popover placement="top">
                    <PopoverTrigger>
                        <Button variant="icon" margin="0 x-small 0 0" onClick={props.onAttachmentsModalClick.bind(this,props.apptGroup)}>
                            <IconPaperclipLine title="Attachments"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent><Heading level="h4" margin="xx-small">Attachments</Heading></PopoverContent>
                </Popover>
            }
        </div>
    )
}

class CalendarFilter extends Component{
    constructor(props){
        super(props);
        this.handleFilterCalendarChange = this.handleFilterCalendarChange.bind(this);
    }

    handleFilterCalendarChange(e){
        this.props.onFilterCalendarChange(e.target.value);
    }

    render(){
        let courseOptions = [];
        this.props.apptGroups.reduce(function(allCourses,apptGroup){
            apptGroup.courses.forEach(function(course){
                if(!(course.id in allCourses)){
                    allCourses[course.id] = course.name;
                    courseOptions.push(<option key={course.id} value={course.id}>{course.name}</option>);
                }
            });
            return allCourses;
        },{});
        return(
            <Select
                label={<ScreenReaderContent>Filter Appt Groups by Calendar</ScreenReaderContent>}
                onChange={this.handleFilterCalendarChange}
                inline>
                <option value="all">All Calendars</option>
                {courseOptions}
            </Select>
        )
    }
}

class SearchBox extends Component{
    constructor(props){
        super(props);
        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    }
    handleFilterTextChange(e) {
        this.props.onFilterTextChange(e.target.value);
    }
    render(){
        return(
            <TextInput
                label={<ScreenReaderContent>Search appointment groups</ScreenReaderContent>}
                placeholder="Search appt groups..."
                value={this.props.filterText}
                onChange={this.handleFilterTextChange}
                inline
            />
        )
    }
}

class PastFilter extends Component{
    constructor(props){
        super(props);
        this.handleShowPastApptsChange = this.handleShowPastApptsChange.bind(this);
    }
    handleShowPastApptsChange(e) {
        this.props.onShowPastApptsChange(e.target.checked);
    }
    render(){
        return(
            <Checkbox
                label="Show past appointment groups"
                value="medium"
                checked={this.props.showPastAppointments}
                onChange={this.handleShowPastApptsChange}
                inline
            />
        )
    }
}

function DateRange(props) {
    return (
        <Text color="secondary" size="small">
            {props.startDate && <Moment format="MMM D, YYYY ">{props.startDate}</Moment>}
            -
            {props.endDate && <Moment format=" MMM D, YYYY">{props.endDate}</Moment>}
        </Text>
    )
}

function CalendarMenu(props) {
    return (
        <PopoverMenu
            placement="end"
            onSelect={function () { console.log(arguments) }}
            trigger={
                <Button variant="icon">
                    <IconCalendarMonthLine title="Calendar Count" />
                </Button>
            }
        >
            {props.courses.map((course) =>
                <MenuItem key={course.id} target="_parent" href={props.url.protocol + '//' + props.url.hostname + '/courses/' + course.id}>{course.name}</MenuItem>
            )}
        </PopoverMenu>
    )
}

function PublishedStatusIcon() {
    return (
        <IconPublishLine title="Published" style={{color: '#00AC18'}}/>
    )
}

function AppointmentGroupRow(props){
    const apptGroup = props.apptGroup;
    return(
        <tr>
            <td>{apptGroup.isPublished && <PublishedStatusIcon/>}</td>
            <td style={{whiteSpace: "nowrap"}}>
                <Link to={`/apptgroups/${apptGroup.id}`}>
                    <Button variant="link">{apptGroup.title}</Button>
                </Link>
            </td>
            <td style={{whiteSpace: "nowrap"}}><DateRange startDate={apptGroup.start_at} endDate={apptGroup.end_at}/></td>
            <td style={{whiteSpace: "nowrap"}}>
                {(apptGroup.description && apptGroup.description.trim().length > 0) &&
                <Tooltip tip={apptGroup.description} size="medium">
                    <Pill
                        text={apptGroup.description}
                    />
                </Tooltip>
                }
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                {(apptGroup.location_name && apptGroup.location_name.trim().length > 0 && apptGroup.location_address && apptGroup.location_address.trim().length > 0) &&
                    <Tooltip tip={apptGroup.location_address} size="medium">
                        <Pill
                            text={apptGroup.location_name}
                        />
                    </Tooltip>
                }
                {(apptGroup.location_name && apptGroup.location_name.trim().length > 0 && (!apptGroup.location_address ||  (apptGroup.location_address && apptGroup.location_address.trim().length === 0))) &&
                    <Pill
                        text={apptGroup.location_name}
                    />
                }
            </td>
            <td style={{textAlign: "center"}}><CalendarMenu courses={apptGroup.courses} url={new URL(apptGroup.html_url)}/></td>
            <td style={{textAlign: "center"}}>
                <Grid colSpacing="small" rowSpacing="small">
                    <GridRow>
                        <GridCol>
                            <Tooltip tip="Participant Count" size="medium">
                                <Pill
                                    variant="primary"
                                    text={`${apptGroup.participant_count}`}
                                />
                            </Tooltip>
                        </GridCol>
                        {apptGroup.participants_per_appointment &&
                        <GridCol>
                            <Tooltip tip="Max Participants per Slots" size="medium">
                                <Pill
                                    variant="danger"
                                    text={`${apptGroup.participants_per_appointment}`}
                                />
                            </Tooltip>
                        </GridCol>
                        }
                        {apptGroup.max_appointments_per_participant &&
                        <GridCol>
                            <Tooltip tip="Max Slots per Participant" size="medium">
                                <Pill
                                    variant="danger"
                                    text={`${apptGroup.max_appointments_per_participant}`}
                                />
                            </Tooltip>
                        </GridCol>
                        }
                    </GridRow>
                </Grid>
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <SettingsList
                    onDeleteApptGroupClick={props.onDeleteApptGroupClick}
                    apptGroup={apptGroup}
                    onEditClick={props.onEditClick}
                    onMessageIconClick={props.onMessageIconClick}
                    onAttachmentsModalClick={props.onAttachmentsModalClick}
                />
            </td>
        </tr>
    )
}

function AppointmentGroupTable(props){
    const filterText = props.filterText.toLowerCase();
    const showPastAppointments = props.showPastAppointments;
    const filterCalendar = props.filterCalendar;
    const rows = [];
    props.apptGroups.forEach((apptGroup) => {
        if(apptGroup.title === null || apptGroup.title.toLowerCase().indexOf(filterText) === -1){
            return;
        }
        if(!showPastAppointments &&  (!apptGroup.end_at || moment(apptGroup.end_at).isBefore(moment()))){
            return;
        }
        let apptGroupCourseIds = apptGroup.courses.reduce( (a,b) => a.concat(b.id), []);
        if(filterCalendar !== 'all' && !apptGroupCourseIds.includes(parseInt(filterCalendar))){
            return;
        }
        rows.push(
            <AppointmentGroupRow
                key={apptGroup.id}
                apptGroup={apptGroup}
                onDeleteApptGroupClick={props.onDeleteApptGroupClick}
                onEditClick={props.onEditClick}
                onEditModalLoadingChange={props.onEditModalLoadingChange}
                onMessageIconClick={props.onMessageIconClick}
                onAttachmentsModalClick={props.onAttachmentsModalClick}
            />);
    });
    return(
        <Table
            caption={<ScreenReaderContent>My Appointment Groups</ScreenReaderContent>}
            striped="rows"
        >
            <thead>
                <tr>
                    <th width="1"/>
                    <th scope="col">Appointment Group</th>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Location</th>
                    <th width="1">Calendars</th>
                    <th width="1"/>
                    <th width="1"/>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </Table>
    )
}

function SearchBar(props) {
    return(
        <Grid vAlign="middle" colSpacing="none">
            <GridRow>
                <GridCol>
                    {props.activeCourses.length > 0 &&
                    <NewAppointmentGroupModal
                        activeCourses={props.activeCourses}
                        onApptGroupsChange={props.onApptGroupsChange}
                        locations={props.locations}
                        onShowAlertDismiss={props.onShowAlertDismiss}
                        userProfile={props.userProfile}
                    />
                    }
                </GridCol>
                <GridCol width="auto">
                    <SearchBox
                        filterText={props.filterText}
                        onFilterTextChange={props.onFilterTextChange}
                    />
                    &nbsp;
                    <CalendarFilter
                        apptGroups={props.apptGroups}
                        onFilterCalendarChange={props.onFilterCalendarChange}
                    />
                    &nbsp;
                    <PastFilter
                        showPastAppointments={props.showPastAppointments}
                        onShowPastApptsChange={props.onShowPastApptsChange}
                    />
                </GridCol>
            </GridRow>
        </Grid>
    )
}

function AttachmentsModal(props){
    return(
        <div style={{padding: "5px"}}>
            <Modal
                open={props.show}
                onDismiss={props.onDismiss}
                size='auto'
                label='Modal Dialog: Attachments'
                shouldCloseOnOverlayClick={false}
                closeButtonLabel="Close"
                applicationElement={() => document.getElementById('root') }
            >
                <ModalHeader>
                    <Heading level="h3">Attachments</Heading>
                </ModalHeader>
                <ModalBody>
                    <AttachmentsList apptGroup={props.apptGroup}/>
                </ModalBody>
            </Modal>
        </div>

    )
}

function AttachmentsList(props){
    const items = props.apptGroup.existingAttachments.map((attachment)=>
        <ListItem key={attachment.id}><Button variant="link" href={attachment.url}>{attachment.displayName}</Button></ListItem>
    );
    return(
        <List variant="unstyled" itemSpacing="small">
            {items}
        </List>
    )
}

function ConfirmDeleteApptGroupModal(props){
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
                <Heading level="h3">Delete Appointment Group</Heading>
            </ModalHeader>
            <ModalBody>
                <Grid vAlign="middle" colSpacing="none">
                    <GridRow>
                        <GridCol>
                            <Text>All students who have signed up for a time slot will be notified that this appointment group is being deleted. Would you like to notify students who have not signed up for a time slot?</Text>
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <RadioInputGroup
                                name="notifyOnApptGroupDelete"
                                description={<ScreenReaderContent>Notify Participants</ScreenReaderContent>}
                                value={props.notifyOnApptGroupDelete}
                                onChange={props.onNotifyOnApptGroupDeleteChange}
                                variant="toggle"
                            >
                                <RadioInput label="No" value="no" context="off" />
                                <RadioInput label="Yes" value="yes" />
                            </RadioInputGroup>
                        </GridCol>
                    </GridRow>
                </Grid>
            </ModalBody>
            <ModalFooter>
                <Button onClick={props.onConfirmClick} variant="danger">Delete</Button>
            </ModalFooter>
        </Modal>
    )
}

class FilterableAppointmentGroupTable extends Component{
    constructor(props){
        super(props);
        this.state = {
            filterText: '',
            showPastAppointments: false,
            filterCalendar: 'all',
            showEditModal: false,
            targetApptGroup: {},
            editModalLoading: false,
            showMessageModal: false,
            showAttachmentsModal: false,
            showConfirmDeleteApptGroupModal: false,
            notifyOnApptGroupDelete: 'no'
        };

        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
        this.handleShowPastApptsChange = this.handleShowPastApptsChange.bind(this);
        this.handleFilterCalendarChange = this.handleFilterCalendarChange.bind(this);
        this.handleEditClick = this.handleEditClick.bind(this);
        this.handleEditModalDismiss = this.handleEditModalDismiss.bind(this);
        this.handleEditModalLoading = this.handleEditModalLoading.bind(this);
        this.handleMessageModalDismiss = this.handleMessageModalDismiss.bind(this);
        this.handleMessageIconClick = this.handleMessageIconClick.bind(this);
        this.handleAttachmentsModalClick = this.handleAttachmentsModalClick.bind(this);
        this.handleAttachmentsModalDismiss = this.handleAttachmentsModalDismiss.bind(this);
        this.handleConfirmDeleteApptGroupModalDismiss = this.handleConfirmDeleteApptGroupModalDismiss.bind(this);
        this.handleNotifyOnApptGroupDeleteChange = this.handleNotifyOnApptGroupDeleteChange.bind(this);
        this.handleDeleteApptGroupButtonClick = this.handleDeleteApptGroupButtonClick.bind(this);
        this.handleDeleteApptGroupSubmit = this.handleDeleteApptGroupSubmit.bind(this);
    }

    handleFilterTextChange(filterText){
        this.setState({
            filterText: filterText
        })
    }

    handleShowPastApptsChange(showPastAppointments){
        this.setState({
            showPastAppointments: showPastAppointments
        })
    }

    handleFilterCalendarChange(filterCalendar){
        this.setState({
            filterCalendar: filterCalendar
        })
    }

    handleEditClick(apptGroup){
        this.setState({
            showEditModal: true,
            targetApptGroup: JSON.parse(JSON.stringify(apptGroup))
        })
    }

    handleEditModalLoading(isLoading){
        this.setState({
            editModalLoading: isLoading
        })
    }

    handleEditModalDismiss(){
        this.setState({
            showEditModal: false
        })
    }

    handleMessageIconClick(apptGroup){
        this.setState({
            showMessageModal: true,
            targetApptGroup: apptGroup
        })
    }

    handleMessageModalDismiss(){
        this.setState({
            showMessageModal: false
        })
    }

    handleAttachmentsModalClick(apptGroup){
        this.setState({
            showAttachmentsModal: true,
            targetApptGroup: apptGroup
        })
    }

    handleAttachmentsModalDismiss(){
        this.setState({
            showAttachmentsModal: false
        })
    }

    handleDeleteApptGroupButtonClick(apptGroup){
        this.setState({
            showConfirmDeleteApptGroupModal: true,
            targetApptGroup: apptGroup
        })
    }

    handleDeleteApptGroupSubmit(){
        this.props.onApptGroupDelete(this.state.targetApptGroup.id,'Appointment Group Deleted', 'success', this.state.notifyOnApptGroupDelete === 'yes');
        this.handleConfirmDeleteApptGroupModalDismiss();
    }

    handleConfirmDeleteApptGroupModalDismiss(){
        this.setState({
            showConfirmDeleteApptGroupModal: false,
            notifyOnApptGroupDelete: 'no'
        })
    }

    handleNotifyOnApptGroupDeleteChange(value){
        this.setState({
            notifyOnApptGroupDelete: value
        })
    }

    render(){
        return(
            <div>
                {this.props.showAlert &&
                    <Alert
                        variant={this.props.alertType}
                        margin="small"
                        timeout={5000}
                    >
                        {this.props.alertMessage}
                    </Alert>
                }
                <EditAppointmentGroupModal
                    show={this.state.showEditModal}
                    apptGroup={this.state.targetApptGroup}
                    activeCourses={this.props.activeCourses}
                    onDismiss={this.handleEditModalDismiss}
                    onApptGroupsChange={this.props.onApptGroupsChange}
                    onEditModalLoadingChange={this.handleEditModalLoading}
                    isLoading={this.state.editModalLoading}
                    locations={this.props.locations}
                    onShowAlertDismiss={this.props.onShowAlertDismiss}
                    userProfile={this.props.userProfile}
                />
                <MessageStudentsModal
                    show={this.state.showMessageModal}
                    apptGroup={this.state.targetApptGroup}
                    onDismiss={this.handleMessageModalDismiss}
                    onApptGroupsChange={this.props.onApptGroupsChange}
                />
                <AttachmentsModal
                    show={this.state.showAttachmentsModal}
                    apptGroup={this.state.targetApptGroup}
                    onDismiss={this.handleAttachmentsModalDismiss}
                />
                <ConfirmDeleteApptGroupModal
                    show={this.state.showConfirmDeleteApptGroupModal}
                    apptGroup={this.state.targetApptGroup}
                    onDismiss={this.handleConfirmDeleteApptGroupModalDismiss}
                    notifyOnApptGroupDelete={this.state.notifyOnApptGroupDelete}
                    onNotifyOnApptGroupDeleteChange={this.handleNotifyOnApptGroupDeleteChange}
                    onConfirmClick={this.handleDeleteApptGroupSubmit}
                />
                <SearchBar
                    apptGroups={this.props.apptGroups}
                    activeCourses={this.props.activeCourses}
                    filterText={this.state.filterText}
                    showPastAppointments={this.state.showPastAppointments}
                    filterCalendar={this.state.filterCalendar}
                    onFilterTextChange={this.handleFilterTextChange}
                    onShowPastApptsChange={this.handleShowPastApptsChange}
                    onFilterCalendarChange={this.handleFilterCalendarChange}
                    onApptGroupsChange={this.props.onApptGroupsChange}
                    locations={this.props.locations}
                    onShowAlertDismiss={this.props.onShowAlertDismiss}
                    userProfile={this.props.userProfile}
                />
                <AppointmentGroupTable
                    apptGroups={this.props.apptGroups}
                    filterText={this.state.filterText}
                    showPastAppointments={this.state.showPastAppointments}
                    filterCalendar={this.state.filterCalendar}
                    onDeleteApptGroupClick={this.handleDeleteApptGroupButtonClick}
                    onEditClick={this.handleEditClick}
                    onMessageIconClick={this.handleMessageIconClick}
                    onAttachmentsModalClick={this.handleAttachmentsModalClick}
                />
            </div>
        )
    }
}


export default FilterableAppointmentGroupTable;