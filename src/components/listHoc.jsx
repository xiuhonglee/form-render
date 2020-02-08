/**
 * Created by Tw93 on 2019-12-01.
 * 抽离高阶列表组件
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table, Form, Input, InputNumber, Divider, Tooltip, Icon } from 'antd';

const EditableContext = React.createContext();

class EditableCell extends React.Component {
  getInput = () => {
    if (this.props.inputType === 'number') {
      return <InputNumber />;
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              rules: [
                {
                  required: true,
                  message: `请输入 ${title}!`,
                },
              ],
              initialValue: record[dataIndex],
            })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return (
      <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
    );
  }
}

class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: props.dataSource.slice(), editingKey: '' };

    this.columns = props.columns.slice();
    this.columns.map(item => (item.editable = true));
    this.columns.push({
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center',
      render: (text, record) => {
        const { editingKey } = this.state;
        const editable = this.isEditing(record);

        return (
          <span>
            {editable && (
              <EditableContext.Consumer>
                {form => (
                  <Icon
                    type="check"
                    style={{ color: '#26D60C' }}
                    onClick={() => this.save(form, record.key)}
                  />
                )}
              </EditableContext.Consumer>
            )}
            {!editable && editingKey && (
              <Icon type="lock" style={{ color: '#999' }} />
            )}

            {!editable && !editingKey && (
              <Icon
                type="edit"
                theme="twoTone"
                twoToneColor="#52c41a"
                onClick={editingKey ? null : () => this.edit(record.key)}
              />
            )}
            <Divider type="vertical" />
            <Icon
              type="arrow-up"
              onClick={() => {
                console.log('up');
              }}
            />
            <Divider type="vertical" />
            <Icon
              type="arrow-down"
              onClick={() => {
                console.log('down');
              }}
            />

            <Divider type="vertical" />
            <Icon
              type="plus"
              onClick={() => {
                console.log('plus');
              }}
            />
            <Divider type="vertical" />
            <Icon
              type="delete"
              theme="twoTone"
              twoToneColor="#eb2f96"
              onClick={() => {
                console.log('delete');
              }}
            />
          </span>
        );
      },
    });
  }

  isEditing = record => record.key === this.state.editingKey;

  save(form, key) {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.state.data];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        this.setState({ data: newData, editingKey: '' });
      } else {
        newData.push(row);
        this.setState({ data: newData, editingKey: '' });
      }
    });
  }

  edit(key) {
    this.setState({ editingKey: key });
  }

  render() {
    const components = {
      body: {
        cell: EditableCell,
      },
    };

    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          inputType: col.dataIndex === 'age' ? 'number' : 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
        }),
      };
    });

    return (
      <EditableContext.Provider value={this.props.form}>
        <Table
          components={components}
          bordered
          dataSource={this.state.data}
          columns={columns}
          rowClassName="editable-row"
          pagination={false}
        />
      </EditableContext.Provider>
    );
  }
}

export default function listHoc() {
  return class extends React.PureComponent {
    static propTypes = {
      value: PropTypes.array,
    };

    static defaultProps = {
      value: [],
    };

    constructor(props) {
      super(props);
    }

    render() {
      const { name, schema, formData } = this.props;
      // generate columns
      const columns = [];
      const subProperties = schema.items.properties;
      for (let key in subProperties) {
        const obj = Object.create(null);
        obj.title = subProperties[key].title;
        if (
          subProperties[key].format &&
          subProperties[key].format === 'image'
        ) {
          obj.render = src => (
            <Tooltip
              placement="topLeft"
              title={() => <img src={src} width={100} />}
            >
              {src}
            </Tooltip>
          );
          obj.ellipsis = true;
        }
        obj.dataIndex = key;
        columns.push(obj);
      }

      // generate source
      const tableData = formData[name];
      tableData.map((item, index) => (item.key = `${index + 1}`));

      const EditableFormTable = Form.create()(EditableTable);

      return <EditableFormTable columns={columns} dataSource={tableData} />;
    }
  };
}
