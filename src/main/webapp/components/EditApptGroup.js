import React, {Component} from 'react';
import Button from "@instructure/ui-core/lib/components/Button"
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import Heading from '@instructure/ui-core/lib/components/Heading'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import TimeInput from '@instructure/ui-core/lib/components/TimeInput'
import DateInput from '@instructure/ui-core/lib/components/DateInput'
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import IconPlusSolid from 'instructure-icons/lib/Solid/IconPlusSolid'
import TabList, {TabPanel} from '@instructure/ui-core/lib/components/TabList'
import RadioInput from '@instructure/ui-core/lib/components/RadioInput'
import RadioInputGroup from '@instructure/ui-core/lib/components/RadioInputGroup'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import CheckboxGroup from '@instructure/ui-core/lib/components/CheckboxGroup'
import Checkbox from '@instructure/ui-core/lib/components/Checkbox'
import NumberInput from '@instructure/ui-core/lib/components/NumberInput'
import Select from '@instructure/ui-core/lib/components/Select'
import Table from '@instructure/ui-core/lib/components/Table'
import IconXLine from 'instructure-icons/lib/Line/IconXLine'
import IconXSolid from 'instructure-icons/lib/Solid/IconXSolid'
import IconCheckSolid from 'instructure-icons/lib/Solid/IconCheckSolid'
import Alert from '@instructure/ui-core/lib/components/Alert'
import Text from '@instructure/ui-core/lib/components/Text'
import Billboard from '@instructure/ui-core/lib/components/Billboard'
import FileDrop from '@instructure/ui-core/lib/components/FileDrop'
import IconTrashLine from 'instructure-icons/lib/Line/IconTrashLine'
import IconSaveLine from 'instructure-icons/lib/Line/IconSaveLine'
import IconWarningSolid from 'instructure-icons/lib/Solid/IconWarningSolid'
import Tooltip from '@instructure/ui-core/lib/components/Tooltip'
import Link from '@instructure/ui-core/lib/components/Link'
import moment from "moment"
import axios from 'axios'
import Container from '@instructure/ui-core/lib/components/Container'
import Loading from "./Loading"

class AppointmentGroupForm extends Component {
    constructor(props){
        super(props);
        const apptGroup = this.props.apptGroup;
        this.state = {
            title: apptGroup.title,
            location: apptGroup.location_name ? apptGroup.location_name : '',
            details: apptGroup.description ? apptGroup.description : '',
            address: apptGroup.location_address ? apptGroup.location_address : '',
            startDate: moment().utc().format(),
            startTime: moment().set({hour:9,minute:0,second:0}).utc().format(),
            endTime: moment().set({hour:9,minute:30,second:0}).utc().format(),
            calendarType: apptGroup.participant_type,
            contextCodes: apptGroup.participant_type === 'User' ? this.initializeCourseContextCodes(apptGroup.context_codes, apptGroup.sub_context_codes) : {},
            slotInterval: '5',
            newSlots: [],
            maxParticipantsPerSlot: apptGroup.participants_per_appointment ? apptGroup.participants_per_appointment.toString() : '0',
            maxSlotsPerParticipant: apptGroup.max_appointments_per_participant ? apptGroup.max_appointments_per_participant.toString() : '0',
            slotVisibility: apptGroup.participant_visibility,
            frequency: '0',
            frequencyDays: [],
            frequencyEndType: 'on',
            frequencyEndDateValue: undefined,
            frequencyEndOccurrenceValue: '1',
            notificationPreferences: [
                {name: 'appt-group-published', enabled: apptGroup.enabledNotificationPreferences.includes('appt-group-published'), description: 'Appointment Group Published'},
                {name: 'appt-group-updated', enabled: apptGroup.enabledNotificationPreferences.includes('appt-group-updated'), description: 'Appointment Group Updates'},
                {name: 'time-slot-reserved', enabled: apptGroup.enabledNotificationPreferences.includes('time-slot-reserved'), description: 'Appointment Signups'},
                {name: 'time-slot-unreserved', enabled: apptGroup.enabledNotificationPreferences.includes('time-slot-unreserved'), description: 'Appointment Cancellations'},
                {name: 'time-slot-canceled', enabled: apptGroup.enabledNotificationPreferences.includes('time-slot-canceled'), description: 'Appointment Deletions'},
                {name: 'time-slot-updated', enabled: apptGroup.enabledNotificationPreferences.includes('time-slot-updated'), description: 'Appointment Updates'}
            ],
            publish: apptGroup.isPublished,
            attachments: [],
            existingSlots: apptGroup.appointments,
            existingAttachments: apptGroup.existingAttachments ? apptGroup.existingAttachments : [],
            existingSlotAlertType: '',
            existingSlotAlertMessage: '',
            showExistingSlotAlert: '',
            showConfirmModalWithComments: false,
            cancellationComments: '',
            targetAppt: {},
            showConfirmUnpublish: false,
            unsavedExistingSlots: []
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleDateInputChange = this.handleDateInputChange.bind(this);
        this.handleStartTimeInputChange = this.handleStartTimeInputChange.bind(this);
        this.handleEndTimeInputChange = this.handleEndTimeInputChange.bind(this);
        this.handleCalendarTypeChange = this.handleCalendarTypeChange.bind(this);
        this.handleContextCodesChange = this.handleContextCodesChange.bind(this);
        this.handleNewSlotDateChange = this.handleNewSlotDateChange.bind(this);
        this.handleNewSlotStartTimeChange = this.handleNewSlotStartTimeChange.bind(this);
        this.handleNewSlotEndTimeChange = this.handleNewSlotEndTimeChange.bind(this);
        this.handleNewSlotMaxParticipantsChange = this.handleNewSlotMaxParticipantsChange.bind(this);
        this.handleExistingSlotDateChange = this.handleExistingSlotDateChange.bind(this);
        this.handleExistingSlotStartTimeChange = this.handleExistingSlotStartTimeChange.bind(this);
        this.handleExistingSlotEndTimeChange = this.handleExistingSlotEndTimeChange.bind(this);
        this.handleExistingSlotMaxParticipantsChange = this.handleExistingSlotMaxParticipantsChange.bind(this);
        this.handleAddSlotButtonClick = this.handleAddSlotButtonClick.bind(this);
        this.handleSlotIntervalChange = this.handleSlotIntervalChange.bind(this);
        this.handleMaxParticipantsPerSlotChange = this.handleMaxParticipantsPerSlotChange.bind(this);
        this.handleMaxSlotsPerParticipantChange = this.handleMaxSlotsPerParticipantChange.bind(this);
        this.handleSlotVisibilityChange = this.handleSlotVisibilityChange.bind(this);
        this.handleRemoveNewSlotClick = this.handleRemoveNewSlotClick.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFrequencyChange = this.handleFrequencyChange.bind(this);
        this.handleFrequencyDaysChange = this.handleFrequencyDaysChange.bind(this);
        this.handleFrequencyEndTypeChange = this.handleFrequencyEndTypeChange.bind(this);
        this.handleFrequencyEndDateChange = this.handleFrequencyEndDateChange.bind(this);
        this.handleFrequencyEndOccurrenceChange = this.handleFrequencyEndOccurrenceChange.bind(this);
        this.handleNotificationEnabledChange = this.handleNotificationEnabledChange.bind(this);
        this.handlePublishChange = this.handlePublishChange.bind(this);
        this.handleAttachmentAdded = this.handleAttachmentAdded.bind(this);
        this.handleRemoveAttachment = this.handleRemoveAttachment.bind(this);
        this.handleExistingSlotDelete = this.handleExistingSlotDelete.bind(this);
        this.handleExistingSlotSave = this.handleExistingSlotSave.bind(this);
        this.handleRemoveExistingAttachment = this.handleRemoveExistingAttachment.bind(this);
        this.handleConfirmSlotDelete = this.handleConfirmSlotDelete.bind(this);
        this.handleConfirmSlotDeleteDismiss = this.handleConfirmSlotDeleteDismiss.bind(this);
        this.handleCancellationCommentsChange = this.handleCancellationCommentsChange.bind(this);
        this.handleConfirmUnpublish = this.handleConfirmUnpublish.bind(this);
        this.handleConfirmUnpublishDismiss = this.handleConfirmUnpublishDismiss.bind(this);
    }

    initializeCourseContextCodes(contextCodes, subContextCodes){
        const existingContextCodes = {};
        contextCodes.forEach((contextCode)=>{
            existingContextCodes[contextCode] = subContextCodes
        });
        return existingContextCodes;
    }

    handleInputChange(event){
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({
            [name]: value
        })
    }

    handleDateInputChange(e, momentObj, rawValue){
        this.setState({
            startDate: rawValue
        })
    }

    handleStartTimeInputChange(e, timeObj){
        this.setState({
            startTime: timeObj.value
        })
    }

    handleEndTimeInputChange(e, timeObj){
        this.setState({
            endTime: timeObj.value
        })
    }

    handleExistingSlotDelete(apptId, apptGroupId){
        this.props.onEditModalLoadingChange(true);
        axios.delete('/signup/appointmentGroups/slot/' + apptId + '?comments=' + this.state.comments).then(function(){
            axios.get('/signup/appointmentGroups/single/' + apptGroupId).then(function(response){
                this.setState({
                    existingSlots: response.data.appointments,
                    existingSlotAlertType: 'success',
                    existingSlotAlertMessage: 'Appointment Slot Deleted',
                    showExistingSlotAlert: true,
                    unsavedExistingSlots: []
                });
                this.props.onEditModalLoadingChange(false);
            }.bind(this));
            this.props.onApptGroupsChange('Appointment Group Updated','success');
        }.bind(this));
        this.setState({
            showExistingSlotAlert: false,
            showConfirmModalWithComments: false
        });
    }

    handleExistingSlotSave(apptId, apptGroupId, index){
        this.props.onEditModalLoadingChange(true);
        axios.put('/signup/appointmentGroups/slot/' + apptId, this.state.existingSlots[index]).then(function(){
            axios.get('/signup/appointmentGroups/single/' + apptGroupId).then(function(response){
                this.setState({
                    existingSlots: response.data.appointments,
                    existingSlotAlertType: 'success',
                    existingSlotAlertMessage: 'Appointment Slot Updated',
                    showExistingSlotAlert: true,
                    unsavedExistingSlots: []
                });
                this.props.onEditModalLoadingChange(false);
            }.bind(this));
            this.props.onApptGroupsChange('Appointment Group Updated','success');
        }.bind(this)).catch((error) => {
            this.setState({
                existingSlotAlertType: 'error',
                existingSlotAlertMessage: error.response.data.errorMessage,
                showExistingSlotAlert: true
            });
            this.props.onEditModalLoadingChange(false);
        });
        this.setState({showExistingSlotAlert: false});
    }

    handleCalendarTypeChange(value){
        this.setState({
            calendarType: value,
            contextCodes: {}
        })
    }

    handleContextCodesChange(contextCode, value){
        const calendarType = this.state.calendarType;
        const contextCodes = Object.assign({},this.state.contextCodes);
        contextCodes[contextCode] = value;
        if(calendarType === 'User') {
            if(value.length === 0){
                delete contextCodes[contextCode];
            }
        }
        this.setState({
            contextCodes: contextCodes
        });
    }

    handleNewSlotDateChange(index, e, momentObj, rawValue){
        const newSlots = this.state.newSlots.slice();
        newSlots[index].date = rawValue;
        this.setState({
            newSlots: newSlots
        })
    }

    handleNewSlotStartTimeChange(index, e, timeObj){
        const newSlots = this.state.newSlots.slice();
        newSlots[index].startTime = timeObj.value;
        this.setState({
            newSlots: newSlots
        })
    }

    handleNewSlotEndTimeChange(index, e, timeObj){
        const newSlots = this.state.newSlots.slice();
        newSlots[index].endTime = timeObj.value;
        this.setState({
            newSlots: newSlots
        })
    }

    handleNewSlotMaxParticipantsChange(index, e, value){
        const newSlots = this.state.newSlots.slice();
        newSlots[index].maxParticipantsPerSlot = parseInt(value);
        this.setState({
            newSlots: newSlots
        })
    }

    handleExistingSlotDateChange(index, e, apptId, momentObj, rawValue){
        const existingSlots = this.state.existingSlots.slice();
        const unsavedExistingSlots = this.state.unsavedExistingSlots.slice();
        const endAtMoment = moment(existingSlots[index].end_at);
        existingSlots[index].start_at = rawValue;
        existingSlots[index].end_at = moment(rawValue).set({hour:endAtMoment.hour(),minute:endAtMoment.minute(),second:endAtMoment.second()}).utc().format();
        this.setState({
            existingSlots: existingSlots
        });
        if(!unsavedExistingSlots.includes(apptId)){
            unsavedExistingSlots.push(apptId);
            this.setState({
                unsavedExistingSlots: unsavedExistingSlots
            })
        }
    }

    handleExistingSlotStartTimeChange(index, apptId, e, timeObj){
        const existingSlots = this.state.existingSlots.slice();
        const unsavedExistingSlots = this.state.unsavedExistingSlots.slice();
        existingSlots[index].start_at = timeObj.value;
        this.setState({
            existingSlots: existingSlots
        });
        if(!unsavedExistingSlots.includes(apptId)){
            unsavedExistingSlots.push(apptId);
            this.setState({
                unsavedExistingSlots: unsavedExistingSlots
            })
        }
    }

    handleExistingSlotEndTimeChange(index, apptId, e, timeObj){
        const existingSlots = this.state.existingSlots.slice();
        const unsavedExistingSlots = this.state.unsavedExistingSlots.slice();
        const startAtMoment = moment(existingSlots[index].start_at);
        existingSlots[index].end_at = moment(timeObj.value).set({month:startAtMoment.month(),day:startAtMoment.day(),year:startAtMoment.year()}).utc().format();
        this.setState({
            existingSlots: existingSlots
        });
        if(!unsavedExistingSlots.includes(apptId)){
            unsavedExistingSlots.push(apptId);
            this.setState({
                unsavedExistingSlots: unsavedExistingSlots
            })
        }
    }

    handleExistingSlotMaxParticipantsChange(index, apptId, e, value){
        const existingSlots = this.state.existingSlots.slice();
        const unsavedExistingSlots = this.state.unsavedExistingSlots.slice();
        existingSlots[index].participants_per_appointment = parseInt(value);
        this.setState({
            existingSlots: existingSlots
        });
        if(!unsavedExistingSlots.includes(apptId)){
            unsavedExistingSlots.push(apptId);
            this.setState({
                unsavedExistingSlots: unsavedExistingSlots
            })
        }
    }

    handleSlotIntervalChange(e, value){
        this.setState({
            slotInterval: value
        })
    }

    handleMaxParticipantsPerSlotChange(e, value){
        this.setState({
            maxParticipantsPerSlot: value
        })
    }

    handleMaxSlotsPerParticipantChange(e, value){
        this.setState({
            maxSlotsPerParticipant: value
        })
    }

    handleSlotVisibilityChange(e){
        this.setState({
            slotVisibility: e.target.value
        })
    }

    handleRemoveNewSlotClick(index){
        const newSlots = this.state.newSlots.slice();
        newSlots.splice(index,1);
        this.setState({
            newSlots: newSlots
        })
    }

    handleFrequencyChange(e){
        this.setState({
            frequency: e.target.value
        })
    }

    handleFrequencyDaysChange(value){
        this.setState({
            frequencyDays: value.sort()
        })
    }

    handleFrequencyEndTypeChange(value){
        this.setState({
            frequencyEndType: value,
            frequencyEndDateValue: undefined,
            frequencyEndOccurrenceValue: '1'
        })
    }

    handleFrequencyEndDateChange(e, momentObj, rawValue){
        this.setState({
            frequencyEndDateValue: rawValue
        })
    }

    handleFrequencyEndOccurrenceChange(e, value){
        this.setState({
            frequencyEndOccurrenceValue: value
        })
    }

    handleAddSlotButtonClick(){
        const startTime = moment(this.state.startTime);
        const endTime = moment(this.state.endTime);
        const slotInterval = parseInt(this.state.slotInterval);

        const frequencyDates = this.calculateFrequencyDate();
        const result = [];
        frequencyDates.forEach((date) => {
            const start = date.clone().set({hour:startTime.hour(),minute:startTime.minute(),second:0});
            const end = date.clone().set({hour:endTime.hour(),minute:endTime.minute(),second:0});
            const current = start.clone();
            while (current <= end) {
                const projectedEnd = current.clone().add(slotInterval, 'minutes');
                if(projectedEnd > end){
                    break;
                }
                const slot = {date: current.utc().format(), startTime: current.utc().format()};
                current.add(slotInterval, 'minutes');
                slot.endTime = current.utc().format();
                result.push(slot);
            }
        });

        this.setState({
            newSlots: result
        })

    }

    calculateFrequencyDate(){
        const frequencyDates = [];
        const frequencyOption = this.state.frequency;
        const frequencyDays = this.state.frequencyDays;
        const frequencyEndType = this.state.frequencyEndType;

        const startDate = moment(this.state.startDate).startOf('day');
        if(frequencyOption === '0'){
            frequencyDates.push(startDate);
        }
        else{
            let dateCounter = startDate.clone().startOf('day');
            if(frequencyEndType === 'after'){
                let frequencyEndValue = this.state.frequencyEndOccurrenceValue;
                let i = 0;
                while (i < frequencyEndValue) {
                    frequencyDays.forEach((day) => {
                        let currentDate = dateCounter.clone().day(parseInt(day));
                        if(currentDate.isBefore(startDate)){
                            return;
                        }
                        frequencyDates.push(currentDate);
                    });
                    if (frequencyOption === "1") {
                        dateCounter.add(1, 'weeks');
                    }
                    else if (frequencyOption === "2") {
                        dateCounter.add(2, 'weeks');
                    }
                    i++;
                }

            }
            else if(frequencyEndType === 'on'){
                let frequencyEndValue = moment(this.state.frequencyEndDateValue).startOf('day');
                while(dateCounter <= frequencyEndValue){
                    frequencyDays.forEach((day) => {
                        let currentDate = dateCounter.clone().day(parseInt(day));
                        if(currentDate.isBefore(startDate)){
                            return;
                        }
                        frequencyDates.push(currentDate);
                    });
                    if (frequencyOption === "1") {
                        dateCounter.add(1, 'weeks');
                    }
                    else if (frequencyOption === "2") {
                        dateCounter.add(2, 'weeks');
                    }
                }
            }
        }
        return frequencyDates;
    }

    handleNotificationEnabledChange(index, value){
        const notificationPreferences = this.state.notificationPreferences.slice();
        notificationPreferences[index].enabled = (value === 'true');
        this.setState({
            notificationPreferences: notificationPreferences
        })
    }

    handlePublishChange(value){
        const isUnpublishing = this.props.apptGroup.isPublished && value === 'false';
        if(isUnpublishing && this.props.apptGroup.participant_count > 0){
            this.setState({
                showConfirmUnpublish: true
            })
        }
        else{
            this.setState({
                publish: value === 'true'
            })
        }
    }

    handleConfirmUnpublish(){
        this.setState({
            showConfirmUnpublish: false,
            publish: false
        })
    }

    handleConfirmUnpublishDismiss(){
        this.setState({
            showConfirmUnpublish: false
        })
    }

    handleAttachmentAdded(acceptedFile){
        const attachments = this.state.attachments.concat(acceptedFile);
        this.setState({
            attachments: attachments
        })
    }

    handleRemoveAttachment(index){
        const attachments = this.state.attachments.slice();
        attachments.splice(index,1);
        this.setState({
            attachments: attachments
        })
    }

    handleRemoveExistingAttachment(fileName, index){
        this.props.onEditModalLoadingChange(true);
        axios.delete('/signup/appointmentGroups/' + this.props.apptGroup.id + '/attachment?fileName=' + fileName).then(function(response){
            const existingAttachments = this.state.existingAttachments.slice();
            existingAttachments.splice(index,1);
            this.setState({
                existingAttachments: existingAttachments
            });
            this.props.onEditModalLoadingChange(false);
        }.bind(this))
    }

    handleConfirmSlotDelete(appt){
        this.setState({
            showConfirmModalWithComments: true,
            targetAppt: appt
        })
    }

    handleConfirmSlotDeleteDismiss(){
        this.setState({
            showConfirmModalWithComments: false
        })
    }

    handleCancellationCommentsChange(e){
        this.setState({
            cancellationComments: e.target.value
        })
    }

    handleSubmit(e){
        e.preventDefault();
        const { title, location, details, address, contextCodes, newSlots, maxParticipantsPerSlot, maxSlotsPerParticipant, slotVisibility, notificationPreferences, publish } = this.state;
        const fileData = new FormData();
        this.state.attachments.forEach((file) => {
            fileData.append('files[]',file,file.name);
        });
        axios.post('/signup/appointmentGroups/saveExistingApptGroup', { title, location, details, address, contextCodes, newSlots, maxParticipantsPerSlot: parseInt(maxParticipantsPerSlot), maxSlotsPerParticipant: parseInt(maxSlotsPerParticipant), slotVisibility, notificationPreferences, publish, apptGroupId: this.props.apptGroup.id, workflowState: this.props.apptGroup.workflow_state})
            .then(() => {
                if(fileData.has('files[]')){
                    axios.post('/signup/appointmentGroups/' + this.props.apptGroup.id + '/files', fileData)
                }
                this.props.onApptGroupsChange('Appointment Group Updated','success');
                this.props.onSuccessSubmit();
            }).catch((error)=>{
                this.props.onApptGroupsChange(error.response.data.errorMessage,'error',true);
                this.props.onSuccessSubmit();
        });
        this.props.onShowAlertDismiss();
    }

    render(){
        //validate required tabs
        const isTab1Valid = this.state.title.length > 0;
        const isTab2Valid = this.state.newSlots.length > 0 || this.state.existingSlots.length > 0;
        const newSlotsValid = this.state.newSlots.filter(slot => (moment(slot.startTime).isBefore(moment()) || moment(slot.endTime).isBefore(moment()))).length === 0;

        return (
            <form onSubmit={this.handleSubmit}>
                <ConfirmModalWithAlert
                    show={this.state.showConfirmUnpublish}
                    onDismiss={this.handleConfirmUnpublishDismiss}
                    text="At least 1 student has already reserved a timeslot for this group. Unpublishing this group will cancel all existing reservations. Are you sure you would like to unpublish this group?"
                    title="Unpublish Warning"
                    confirmSubmitCallback={this.handleConfirmUnpublish}
                />
                <TabList>
                    <TabPanel title="General Info">
                        <Grid colSpacing="large" rowSpacing="small">
                            <GridRow>
                                <GridCol>
                                    <TextInput
                                        name="title"
                                        onChange={this.handleInputChange}
                                        value={this.state.title}
                                        label="Title"
                                        messages={[this.state.title.length === 0 ? { text: 'Required', type: 'error' } : {}]}
                                        required
                                    />
                                    <TextInput
                                        name="location"
                                        onChange={this.handleInputChange}
                                        value={this.state.location}
                                        label="Location"
                                    />
                                </GridCol>
                                <GridCol>
                                    <TextInput
                                        name="details"
                                        onChange={this.handleInputChange}
                                        value={this.state.details}
                                        label="Details"
                                        messages={[{}]}
                                    />
                                    <TextInput
                                        name="address"
                                        onChange={this.handleInputChange}
                                        value={this.state.address}
                                        label="Address"
                                    />
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Create Slots">
                        <Grid colSpacing="large" rowSpacing="small">
                            {!isTab2Valid &&
                            <GridRow>
                                <GridCol>
                                    <Alert
                                        variant="warning"
                                        margin="0"
                                    >
                                        No appointment slots added
                                    </Alert>
                                </GridCol>
                            </GridRow>
                            }
                            {!newSlotsValid &&
                            <GridRow>
                                <GridCol>
                                    <Alert
                                        variant="warning"
                                        margin="0"
                                    >
                                        Slot occurs in past
                                    </Alert>
                                </GridCol>
                            </GridRow>
                            }
                            <GridRow>
                                <GridCol textAlign="center">
                                    <Heading margin="small" level="h4">All times you select below are in {this.props.userProfile && this.props.userProfile.time_zone} time</Heading>
                                </GridCol>
                            </GridRow>
                            <GridRow>
                                <GridCol>
                                    <DateInput
                                        previousLabel="previous month"
                                        nextLabel="next month"
                                        placeholder="Select a date"
                                        label="Date"
                                        validationFeedback={false}
                                        inline
                                        required
                                        onDateChange={this.handleDateInputChange}
                                        dateValue={this.state.startDate}
                                        timezone={this.props.userProfile && this.props.userProfile.time_zone}
                                        invalidDateMessage={(value) => { return `'${value}' is not a valid date` }}
                                    />
                                </GridCol>
                                <GridCol>
                                    <TimeInput onChange={this.handleStartTimeInputChange} value={this.state.startTime} timezone={this.props.userProfile && this.props.userProfile.time_zone} step={5} label='Start'/>
                                </GridCol>
                                <GridCol>
                                    <TimeInput onChange={this.handleEndTimeInputChange} value={this.state.endTime} timezone={this.props.userProfile && this.props.userProfile.time_zone} step={5} label='End' />
                                </GridCol>
                                <GridCol>
                                    <NumberInput
                                        label="Slot Duration"
                                        name="slotInterval"
                                        value={this.state.slotInterval}
                                        min='1'
                                        onChange={this.handleSlotIntervalChange}
                                        messages={[{ text: 'minutes', type: 'hint' }]}
                                    />
                                </GridCol>
                            </GridRow>
                            <GridRow>
                                <GridCol>
                                    <Select width="2"
                                            inline
                                            label="Repeats Every"
                                            value={this.state.frequency}
                                            onChange={this.handleFrequencyChange}
                                    >
                                        <option value="0">Does not repeat</option>
                                        <option value="1">Week</option>
                                        <option value="2">2 weeks</option>
                                    </Select>
                                </GridCol>
                                {this.state.frequency !== '0' &&
                                <GridCol>
                                    <CheckboxGroup
                                        onChange={this.handleFrequencyDaysChange}
                                        value={this.state.frequencyDays}
                                        messages={[{}]}
                                        description="Repeats On"
                                        name="frequencyDays"
                                    >
                                        <Checkbox label="Sun" value="0"/>
                                        <Checkbox label="Mon" value="1"/>
                                        <Checkbox label="Tue" value="2"/>
                                        <Checkbox label="Wed" value="3"/>
                                        <Checkbox label="Thu" value="4"/>
                                        <Checkbox label="Fri" value="5"/>
                                        <Checkbox label="Sat" value="6"/>
                                    </CheckboxGroup>
                                </GridCol>
                                }
                                {this.state.frequency !== '0' &&
                                <GridCol>
                                    <RadioInputGroup
                                        name="frequencyEnd"
                                        description="Ends"
                                        value={this.state.frequencyEndType}
                                        onChange={this.handleFrequencyEndTypeChange}
                                    >
                                        <RadioInput label="On" value="on"/>
                                        <RadioInput label="After" value="after"/>
                                    </RadioInputGroup>
                                </GridCol>
                                }
                                {this.state.frequency !== '0' &&
                                <GridCol>
                                    {this.state.frequencyEndType === 'on' ?
                                        <FrequencyEndDateInput frequencyEndValue={this.state.frequencyEndDateValue} onFrequencyEndDateChange={this.handleFrequencyEndDateChange} userProfile={this.props.userProfile}/> :
                                        <FrequencyEndOccurrenceInput frequencyEndValue={this.state.frequencyEndOccurrenceValue} onFrequencyEndOccurrenceChange={this.handleFrequencyEndOccurrenceChange}/>
                                    }
                                </GridCol>
                                }
                            </GridRow>
                            <GridRow>
                                <GridCol textAlign="center">
                                    <Button onClick={this.handleAddSlotButtonClick}  margin="0">
                                        Add Slots
                                    </Button>
                                </GridCol>
                            </GridRow>

                            <GridRow>
                                <GridCol>
                                    <NewSlotTable
                                        onNewSlotDateChange={this.handleNewSlotDateChange}
                                        onNewSlotStartTimeChange={this.handleNewSlotStartTimeChange}
                                        onNewSlotEndTimeChange={this.handleNewSlotEndTimeChange}
                                        onNewSlotMaxParticipantsChange={this.handleNewSlotMaxParticipantsChange}
                                        onRemoveNewSlotClick={this.handleRemoveNewSlotClick}
                                        newSlots={this.state.newSlots}
                                        userProfile={this.props.userProfile}
                                    />
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Manage Slots">
                        <ConfirmModalWithComments
                            show={this.state.showConfirmModalWithComments}
                            onDismiss={this.handleConfirmSlotDeleteDismiss}
                            text="Are you sure you want to delete this appointment slot and any existing reservations?"
                            buttonText="Delete"
                            buttonType="danger"
                            title="Delete Appointment Slot"
                            confirmSubmitCallback={this.handleExistingSlotDelete.bind(this,this.state.targetAppt.id,this.props.apptGroup.id)}
                            onCancellationCommentsChange={this.handleCancellationCommentsChange}
                        />
                        <Grid colSpacing="large" rowSpacing="small">
                            {this.state.showExistingSlotAlert &&
                                <Alert
                                    variant={this.state.existingSlotAlertType}
                                    margin="small"
                                    timeout={5000}
                                >
                                    {this.state.existingSlotAlertMessage}
                                </Alert>
                            }
                            {this.state.unsavedExistingSlots.length > 0 &&
                            <GridRow>
                                <GridCol>
                                    <Alert
                                        variant="warning"
                                        margin="0"
                                    >
                                        You have unsaved changes. Please click the save time slot changes before you save and close.
                                    </Alert>
                                </GridCol>
                            </GridRow>
                            }
                            <GridRow>
                                <GridCol>
                                    <ExistingSlotTable
                                        onExistingSlotDateChange={this.handleExistingSlotDateChange}
                                        onExistingSlotStartTimeChange={this.handleExistingSlotStartTimeChange}
                                        onExistingSlotEndTimeChange={this.handleExistingSlotEndTimeChange}
                                        onExistingSlotMaxParticipantsChange={this.handleExistingSlotMaxParticipantsChange}
                                        onExistingSlotDelete={this.handleExistingSlotDelete}
                                        onExistingSlotSave={this.handleExistingSlotSave}
                                        existingSlots={this.state.existingSlots}
                                        onConfirmSlotDelete={this.handleConfirmSlotDelete}
                                        userProfile={this.props.userProfile}
                                    />
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Calendars">
                        <Grid colSpacing="large" rowSpacing="small">
                            <GridRow>
                                <GridCol textAlign="center">
                                    <RadioInputGroup
                                        layout="columns"
                                        name="calendarType"
                                        inline
                                        defaultValue={this.state.calendarType}
                                        description={<ScreenReaderContent>Choose Calendar Type</ScreenReaderContent>}
                                        readOnly
                                    >
                                        <RadioInput
                                            key="Courses & Sections"
                                            value="User"
                                            label="Courses & Sections"
                                        />
                                        <RadioInput
                                            key="Groups"
                                            value="Group"
                                            label="Groups"
                                        />
                                    </RadioInputGroup>
                                </GridCol>
                            </GridRow>
                            <GridRow>
                                <GridCol>
                                    <CalendarOptions calendarType={this.state.calendarType} activeCourses={this.props.activeCourses} contextCodes={this.state.contextCodes} onContextCodesChange={this.handleContextCodesChange} apptGroup={this.props.apptGroup}/>
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Options">
                        <Grid hAlign="space-around" colSpacing="large" rowSpacing="small">
                            <GridRow>
                                <GridCol>
                                    <NumberInput
                                        label="Max # Participants per Slot"
                                        value={this.state.maxParticipantsPerSlot}
                                        onChange={this.handleMaxParticipantsPerSlotChange}
                                        width="9rem"
                                        min='0'
                                        messages={[{ text: '0 = Unlimited', type: 'hint' }]}
                                    />
                                </GridCol>
                                <GridCol>
                                    <NumberInput
                                        label="Max # Slots per Participant"
                                        value={this.state.maxSlotsPerParticipant}
                                        onChange={this.handleMaxSlotsPerParticipantChange}
                                        width="9rem"
                                        min='0'
                                        messages={[{ text: '0 = Unlimited', type: 'hint' }]}
                                    />
                                </GridCol>
                                <GridCol>
                                    <Select
                                        label="Slot Visibility"
                                        value={this.state.slotVisibility}
                                        onChange={this.handleSlotVisibilityChange}
                                        messages={[{ text: 'Visibility of participant names to other participants in a reserved slot', type: 'hint' }]}
                                    >
                                        <option value="private">Not Visible</option>
                                        <option value="protected">Visible</option>
                                    </Select>
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Notifications">
                        <Grid colSpacing="large" rowSpacing="small">
                            <GridRow>
                                <GridCol>
                                    <NotificationTable onNotificationEnabledChange={this.handleNotificationEnabledChange} notificationPreferences={this.state.notificationPreferences}/>
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                    <TabPanel title="Files">
                        <Grid colSpacing="large" rowSpacing="small">
                            <GridRow>
                                <GridCol>
                                    <FileDrop
                                        label={
                                            <Billboard
                                                size="small"
                                                heading="Upload a file"
                                                headingLevel="h3"
                                                hero={<IconPlusSolid />}
                                            />
                                        }
                                        onDropAccepted={this.handleAttachmentAdded}
                                    />
                                </GridCol>
                            </GridRow>
                            <GridRow>
                                <GridCol>
                                    <AttachmentTable existingAttachments={this.state.existingAttachments} attachments={this.state.attachments} onRemoveAttachment={this.handleRemoveAttachment} onRemoveExistingAttachment={this.handleRemoveExistingAttachment}/>
                                </GridCol>
                            </GridRow>
                        </Grid>
                    </TabPanel>
                </TabList>
                <div style={{background: "#F5F5F5", padding: "20px"}}>
                    <Grid startAt="medium" vAlign="middle" colSpacing="none">
                        <GridRow>
                            <GridCol>
                                <PublishStatusRadio publish={this.state.publish} onPublishChange={this.handlePublishChange}/>
                            </GridCol>
                            <GridCol width="auto">
                                <Button disabled={!isTab1Valid || !isTab2Valid || !newSlotsValid} type="submit" variant="primary">Save and Close</Button>
                            </GridCol>
                        </GridRow>
                    </Grid>
                </div>

            </form>
        )
    }
}

function CalendarOptions(props){
    return(
        <div>
            {props.calendarType === 'User' &&
            props.activeCourses.map((course) =>
                <div>
                    <Text weight="bold">{course.name}</Text>
                    <Container
                        as="div"
                        size="small"
                        textAlign="center"
                        margin="small 0 0 small"
                        padding="0"
                    >
                        <CheckboxGroup
                            key={course.id}
                            onChange={props.onContextCodesChange.bind(this,`course_${course.id}`)}
                            value={props.contextCodes[`course_${course.id}`] ? props.contextCodes[`course_${course.id}`] : []}
                            messages={[{}]}
                            description={<ScreenReaderContent>Calendar Options</ScreenReaderContent>}
                            name="calendarOptions"
                        >
                            {course.sections.map((section) =>
                                <Checkbox key={section.id} label={section.name} value={`course_section_${section.id}`} readOnly={props.apptGroup.sub_context_codes.includes(`course_section_${section.id}`)}/>
                            )}
                        </CheckboxGroup>
                    </Container>
                </div>
            )
            }
            {props.calendarType === 'Group' &&
            props.activeCourses.map((course) => {
                    return ( course.groupCategories &&
                        <div>
                            <Text weight="bold">{course.name}</Text>
                            <Container
                                as="div"
                                size="small"
                                textAlign="center"
                                margin="small 0 0 small"
                                padding="0"
                            >
                                <RadioInputGroup
                                    key={course.id}
                                    defaultValue={props.apptGroup.context_codes.includes(`course_${course.id}`) ? props.apptGroup.sub_context_codes[0] : ''}
                                    messages={[{}]}
                                    description={<ScreenReaderContent>Calendar Options</ScreenReaderContent>}
                                    name="calendarOptions"
                                    readOnly
                                >
                                    {course.groupCategories.map((group) =>
                                        <RadioInput key={group.id} label={group.name} value={`group_category_${group.id}`}/>
                                    )}
                                </RadioInputGroup>
                            </Container>
                        </div>
                    )
                }
            )
            }
        </div>
    )
}

function NewSlotTable(props){
    return(
        <Table
            caption={<ScreenReaderContent>Appt Slots</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th scope="col">Date</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Max # Participants</th>
                <th width="1"/>
            </tr>
            </thead>
            <tbody>
            {props.newSlots.map((newSlot,index) =>
                <NewSlotRow
                    key={index}
                    onNewSlotDateChange={props.onNewSlotDateChange}
                    onNewSlotStartTimeChange={props.onNewSlotStartTimeChange}
                    onNewSlotEndTimeChange={props.onNewSlotEndTimeChange}
                    onNewSlotMaxParticipantsChange={props.onNewSlotMaxParticipantsChange}
                    onRemoveNewSlotClick={props.onRemoveNewSlotClick}
                    slot={newSlot}
                    index={index}
                    userProfile={props.userProfile}
                />
            )}
            </tbody>
        </Table>
    )
}

function NewSlotRow(props){
    return(
        <tr>
            <td style={{whiteSpace: "nowrap", width:"30%"}}>
                <DateInput
                    previousLabel="previous month"
                    nextLabel="next month"
                    placeholder="Select a date"
                    label={<ScreenReaderContent>Date</ScreenReaderContent>}
                    inline
                    required
                    validationFeedback={false}
                    onDateChange={props.onNewSlotDateChange.bind(this, props.index)}
                    dateValue={props.slot.date}
                    invalidDateMessage={(value) => { return `'${value}' is not a valid date` }}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"25%"}}>
                <TimeInput
                    onChange={props.onNewSlotStartTimeChange.bind(this, props.index)}
                    value={props.slot.startTime}
                    timezone={props.userProfile && props.userProfile.time_zone}
                    step={5}
                    label={<ScreenReaderContent>Start Time</ScreenReaderContent>}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"25%"}}>
                <TimeInput
                    onChange={props.onNewSlotEndTimeChange.bind(this, props.index)}
                    value={props.slot.endTime}
                    timezone={props.userProfile && props.userProfile.time_zone}
                    step={5}
                    label={<ScreenReaderContent>End Time</ScreenReaderContent>}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"15%"}}>
                <NumberInput
                    label={<ScreenReaderContent>Max # Participants</ScreenReaderContent>}
                    value={props.slot.maxParticipantsPerSlot ? props.slot.maxParticipantsPerSlot.toString() : ''}
                    onChange={props.onNewSlotMaxParticipantsChange.bind(this, props.index)}
                    width="6rem"
                    min='0'
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"5%"}}>
                <Button onClick={props.onRemoveNewSlotClick.bind(this, props.index)} variant="icon" margin="0">
                    <IconXLine title="Remove"/>
                </Button>
            </td>
        </tr>
    )
}

function ExistingSlotTable(props){
    return(
        <Table
            caption={<ScreenReaderContent>Appt Slots</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th width="1"/>
                <th scope="col">Date</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Max # Participants</th>
                <th width="1"/>
            </tr>
            </thead>
            <tbody>
            {props.existingSlots.map((existingSlot,index) =>
                <ExistingSlotRow
                    key={index}
                    onExistingSlotDateChange={props.onExistingSlotDateChange}
                    onExistingSlotStartTimeChange={props.onExistingSlotStartTimeChange}
                    onExistingSlotEndTimeChange={props.onExistingSlotEndTimeChange}
                    onExistingSlotMaxParticipantsChange={props.onExistingSlotMaxParticipantsChange}
                    onExistingSlotDelete={props.onExistingSlotDelete}
                    onExistingSlotSave={props.onExistingSlotSave}
                    slot={existingSlot}
                    index={index}
                    onConfirmSlotDelete={props.onConfirmSlotDelete}
                    userProfile={props.userProfile}
                />
            )}
            </tbody>
        </Table>
    )
}

function ExistingSlotRow(props){
    return(
        <tr>
            <td style={{whiteSpace: "nowrap"}}>
                {props.slot.child_events_count > 0 &&
                    <Tooltip tip="Existing Reservations" placement="start">
                        <IconWarningSolid style={{color: '#FC5E13'}}/>
                    </Tooltip>
                }
            </td>
            <td style={{whiteSpace: "nowrap", width:"30%"}}>
                <DateInput
                    previousLabel="previous month"
                    nextLabel="next month"
                    placeholder="Select a date"
                    label={<ScreenReaderContent>Date</ScreenReaderContent>}
                    inline
                    required
                    validationFeedback={false}
                    onDateChange={props.onExistingSlotDateChange.bind(this, props.index, props.slot.id)}
                    dateValue={props.slot.start_at}
                    invalidDateMessage={(value) => { return `'${value}' is not a valid date` }}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"20%"}}>
                <TimeInput
                    onChange={props.onExistingSlotStartTimeChange.bind(this, props.index, props.slot.id)}
                    value={props.slot.start_at}
                    timezone={props.userProfile && props.userProfile.time_zone}
                    step={5}
                    label={<ScreenReaderContent>Start Time</ScreenReaderContent>}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"20%"}}>
                <TimeInput
                    onChange={props.onExistingSlotEndTimeChange.bind(this, props.index, props.slot.id)}
                    value={props.slot.end_at}
                    timezone={props.userProfile && props.userProfile.time_zone}
                    step={5}
                    label={<ScreenReaderContent>End Time</ScreenReaderContent>}
                />
            </td>
            <td style={{whiteSpace: "nowrap", width:"15%"}}>
                <NumberInput
                    label={<ScreenReaderContent>Max # Participants</ScreenReaderContent>}
                    value={props.slot.participants_per_appointment ? props.slot.participants_per_appointment.toString() : ''}
                    onChange={props.onExistingSlotMaxParticipantsChange.bind(this, props.index, props.slot.id)}
                    width="6rem"
                    min='0'
                />
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <Tooltip tip="Save">
                    <Button onClick={props.onExistingSlotSave.bind(this,props.slot.id,props.slot.appointment_group_id,props.index)} variant="icon" margin="0">
                        <IconSaveLine title="Save"/>
                    </Button>
                </Tooltip>
                <Tooltip tip="Delete">
                    <Button onClick={props.onConfirmSlotDelete.bind(this,props.slot)} variant="icon" margin="0">
                        <IconTrashLine title="Delete"/>
                    </Button>
                </Tooltip>
            </td>
        </tr>
    )
}

function FrequencyEndDateInput(props){
    return(
        <DateInput
            previousLabel="previous month"
            nextLabel="next month"
            placeholder="Select a date"
            label="End Date"
            validationFeedback={false}
            inline
            required
            onDateChange={props.onFrequencyEndDateChange}
            dateValue={props.frequencyEndValue}
            timezone={props.userProfile && props.userProfile.time_zone}
            invalidDateMessage={(value) => { return `'${value}' is not a valid date` }}
        />
    )
}

function FrequencyEndOccurrenceInput(props){
    return(
        <NumberInput
            label="Occurrences"
            name="frequencyEndValue"
            value={props.frequencyEndValue}
            min='1'
            onChange={props.onFrequencyEndOccurrenceChange}
            messages={[{}]}
        />
    )
}

function NotificationTable(props){
    return (
        <Table
            caption={<ScreenReaderContent>Notification Preferences</ScreenReaderContent>}
            striped="columns"
        >
            <thead>
            <tr>
                <th scope="col">Event</th>
                <th width="1">Status</th>
            </tr>
            </thead>
            <tbody>
            {props.notificationPreferences.map((notificationPref,index) =>
                <NotificationRow
                    key={index}
                    notificationPref={notificationPref}
                    onNotificationEnabledChange={props.onNotificationEnabledChange}
                    index={index}
                />
            )}
            </tbody>
        </Table>
    )
}

function NotificationRow(props){
    return (
        <tr>
            <td>
                <Text>{props.notificationPref.description}</Text>
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <RadioInputGroup
                    layout="columns"
                    name={props.notificationPref.name}
                    value={props.notificationPref.enabled.toString()}
                    onChange={props.onNotificationEnabledChange.bind(this,props.index)}
                    description={<ScreenReaderContent>Notification Frequency</ScreenReaderContent>}
                    variant="toggle">
                    <RadioInput
                        label={<span><IconCheckSolid title="Enable"/><ScreenReaderContent>This option makes something inactive</ScreenReaderContent></span>}
                        value="true"
                        context="success"
                    />
                    <RadioInput
                        label={<span><IconXSolid title="Published"/><ScreenReaderContent>This option makes something inactive</ScreenReaderContent></span>}
                        value="false"
                        context="off"
                    />
                </RadioInputGroup>
            </td>
        </tr>
    )
}

function AttachmentTable(props){
    return (
        <Table
            caption={<ScreenReaderContent>Attachments</ScreenReaderContent>}
        >
            <thead>
            <tr>
                <th scope="col">File</th>
                <th width="1"/>
            </tr>
            </thead>
            <tbody>
            {props.attachments.map((attachment,index) =>
                <NewAttachmentRow
                    key={index}
                    attachment={attachment}
                    onRemoveAttachment={props.onRemoveAttachment}
                    index={index}
                />
            )}
            {props.existingAttachments.map((attachment,index) =>
                <ExistingAttachmentRow
                    key={index}
                    attachment={attachment}
                    onRemoveExistingAttachment={props.onRemoveExistingAttachment}
                    index={index}
                />
            )}
            </tbody>
        </Table>
    )
}

function NewAttachmentRow(props){
    return (
        <tr>
            <td>
                <Text>{props.attachment.name}</Text>
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <Button onClick={props.onRemoveAttachment.bind(this, props.index)} variant="icon" margin="0">
                    <IconXLine title="Remove"/>
                </Button>
            </td>
        </tr>
    )
}
function ExistingAttachmentRow(props){
    return (
        <tr>
            <td>
                <Link href={props.attachment.url}>{props.attachment.displayName}</Link>
            </td>
            <td style={{whiteSpace: "nowrap"}}>
                <Button onClick={props.onRemoveExistingAttachment.bind(this,props.attachment.displayName, props.index)} variant="icon" margin="0">
                    <IconXLine title="Remove"/>
                </Button>
            </td>
        </tr>
    )
}

function PublishStatusRadio(props){
    return(
        <RadioInputGroup
            name="publishRadio"
            value={props.publish.toString()}
            onChange={props.onPublishChange}
            description={<ScreenReaderContent>Publish Appt Group</ScreenReaderContent>}
            variant="toggle">
            <RadioInput label="Unpublish" value="false" context="off"/>
            <RadioInput label="Publish" value="true" />
        </RadioInputGroup>
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
                            <TextInput label="Cancellation Reason" onChange={props.onCancellationCommentsChange}/>
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

function ConfirmModalWithAlert(props){
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
                            <Alert
                                variant="warning"
                                margin="0"
                            >
                                {props.text}
                            </Alert>
                        </GridCol>
                    </GridRow>
                </Grid>
            </ModalBody>
            <ModalFooter>
                <Button onClick={props.onDismiss}>Close</Button>&nbsp;
                <Button onClick={props.confirmSubmitCallback} variant="primary">OK</Button>
            </ModalFooter>
        </Modal>
    )
}

function EditAppointmentGroupModal(props) {
    return(
        <div style={{padding: "5px"}}>
            <Modal
                open={props.show}
                onDismiss={props.onDismiss}
                size='large'
                label='Modal Dialog: Hello World'
                shouldCloseOnOverlayClick={false}
                closeButtonLabel="Close"
                applicationElement={() => document.getElementById('root') }
            >
                <ModalHeader>
                    <Heading level="h3">Edit Appointment Group</Heading>
                </ModalHeader>
                <ModalBody>
                    <Loading isLoading={props.isLoading}/>
                    <AppointmentGroupForm
                        activeCourses={props.activeCourses}
                        onApptGroupsChange={props.onApptGroupsChange}
                        onSuccessSubmit={props.onDismiss}
                        apptGroup={props.apptGroup}
                        onEditModalLoadingChange={props.onEditModalLoadingChange}
                        onShowAlertDismiss={props.onShowAlertDismiss}
                        userProfile={props.userProfile}
                    />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default EditAppointmentGroupModal;