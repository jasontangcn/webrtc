import React, {Component} from "react";
import {Form, Input, Button} from "antd";

class Login extends Component {
    submit(values) {
        this.props.login(values.userName, values.roomId);
    }

    render() {
        return (
            <Form onFinish={this.submit} className="login-form">
                <Form.Item name="userName">
                    <Input placeholder="Input username pls."/>
                </Form.Item>
                <Form.Item name="roomId">
                    <Input placeholder="Input room id pls."/>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-submit">
                        Login
                    </Button>
                </Form.Item>
            </Form>
        )
    }
}
