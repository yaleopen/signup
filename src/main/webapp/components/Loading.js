import React from 'react'
import Spinner from '@instructure/ui-core/lib/components/Spinner'
import Overlay from '@instructure/ui-core/lib/components/Overlay'
import Mask from '@instructure/ui-core/lib/components/Mask'

function Loading(props) {
    return (
        <Overlay
            open={props.isLoading}
            transition="fade"
            onDismiss={() => { this.setState({ open: false })}}
            label="Overlay Example"
            shouldReturnFocus
        >
            <Mask>
                <div style={{textAlign: "center"}}><Spinner title="Loading" size="large" margin="0 0 0 medium" /></div>
            </Mask>
        </Overlay>
    )
}

export default Loading;