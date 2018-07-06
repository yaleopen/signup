import React, {Component} from 'react';
import Button from "@instructure/ui-core/lib/components/Button"
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import Heading from '@instructure/ui-core/lib/components/Heading'
import TextInput from '@instructure/ui-core/lib/components/TextInput'
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@instructure/ui-core/lib/components/Modal'
import ScreenReaderContent from '@instructure/ui-core/lib/components/ScreenReaderContent'
import Select from '@instructure/ui-core/lib/components/Select'
import axios from 'axios'
import Autocomplete from '@instructure/ui-core/lib/components/Autocomplete'
import TextArea from '@instructure/ui-core/lib/components/TextArea'

class MessageStudentsForm extends Component{
    constructor(props){
        super(props);
        this.state = {
            recipientType: '0',
            selectedRecipients: this.props.apptGroup.participants.reduce(( accumulator, currentValue ) => accumulator.concat(currentValue.id.toString()), []),
            subject: '',
            message: ''
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRecipientTypeChange = this.handleRecipientTypeChange.bind(this);
        this.handleTextInputChange = this.handleTextInputChange.bind(this);
        this.handleSelectedRecipientsChange = this.handleSelectedRecipientsChange.bind(this);
    }

    handleTextInputChange(event){
        const target = event.target;
        this.setState({
            [target.name]: target.value
        })
    }

    handleRecipientTypeChange(e){
        const recipientType = e.target.value;
        let participants = this.props.apptGroup.participants;
        if(recipientType === '1'){
            participants = participants.filter(user => user.reserved)
        }
        else if(recipientType === '2'){
            participants = participants.filter(user => !user.reserved)
        }
        this.setState({
            recipientType: e.target.value,
            selectedRecipients: participants.reduce(( accumulator, currentValue ) => accumulator.concat(currentValue.id.toString()), [])
        })
    }

    handleSelectedRecipientsChange(e, value){
        this.setState({
            selectedRecipients: value
        })
    }

    handleSubmit(e) {
        e.preventDefault();
        const { selectedRecipients, subject, message } = this.state;
        const apptGroup = this.props.apptGroup;
        axios.post('/signup/notification/' + apptGroup.id, { selectedRecipients, subject, message, participantType: apptGroup.participant_type, contextCodes: apptGroup.context_codes })
            .then((response) => {
                this.props.onSuccessSubmit('Message Sent','success',false);
                this.props.onDismiss();
            });
    }

    render(){
        return(
            <form onSubmit={this.handleSubmit}>
                <Grid colSpacing="large" rowSpacing="small">
                    <GridRow>
                        <GridCol>
                            <Select
                                label="Message students who..."
                                value={this.state.recipientType}
                                onChange={this.handleRecipientTypeChange}
                                inline>
                                <option value="0">All students</option>
                                <option value="1">Have reserved a timeslot</option>
                                <option value="2">Haven't reserved a timeslot</option>
                            </Select>
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <StudentAutocomplete
                                options={this.props.apptGroup.participants}
                                recipientType={this.state.recipientType}
                                selectedRecipients={this.state.selectedRecipients}
                                onSelectedRecipientsChange={this.handleSelectedRecipientsChange}
                            />
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <TextInput label="Subject" name="subject" onChange={this.handleTextInputChange} required/>
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <TextArea label="Message" name="message" onChange={this.handleTextInputChange} resize="vertical" required/>
                        </GridCol>
                    </GridRow>
                    <GridRow>
                        <GridCol>
                            <ModalFooter>
                                <Button type="submit" variant="primary">Send Message</Button>
                            </ModalFooter>
                        </GridCol>
                    </GridRow>
                </Grid>
            </form>
        )
    }
}

function StudentAutocomplete(props){
    let options = props.options;
    if(props.recipientType === '1'){
        options = options.filter(user => user.reserved)
    }
    else if(props.recipientType === '2'){
        options = options.filter(user => !user.reserved)
    }
    return(
        <Autocomplete
            label={<ScreenReaderContent>Selected Students</ScreenReaderContent>}
            onChange={props.onSelectedRecipientsChange}
            selectedOption={props.selectedRecipients}
            multiple
            inline
        >
            {options.map((user)=>
                <option key={user.id} value={user.id.toString()}>{user.name}</option>
            )}
        </Autocomplete>
    )
}

function MessageStudentsModal(props) {
    return(
        <div style={{padding: "5px"}}>
            <Modal
                open={props.show}
                onDismiss={props.onDismiss}
                size='auto'
                label='Modal Dialog: Message Students'
                shouldCloseOnOverlayClick={false}
                closeButtonLabel="Close"
                applicationElement={() => document.getElementById('root') }
            >
                <ModalHeader>
                    <Heading level="h3">Message Students for {props.apptGroup && props.apptGroup.title}</Heading>
                </ModalHeader>
                <ModalBody>
                    <MessageStudentsForm
                        onSuccessSubmit={props.onApptGroupsChange}
                        onDismiss={props.onDismiss}
                        apptGroup={props.apptGroup}
                    />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default MessageStudentsModal;