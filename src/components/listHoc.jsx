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
        const disableColor = '#aaa';
        const isFirst = record.key * 1 === 1;
        const isLast = record.key * 1 === props.dataSource.length;
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
              <Icon type="lock" style={{ color: disableColor }} />
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
              style={{
                color: isFirst ? disableColor : '',
              }}
              onClick={() => !isFirst && this.move(record.key * 1, 'up')}
            />
            <Divider type="vertical" />
            <Icon
              type="arrow-down"
              style={{ color: isLast ? disableColor : '' }}
              onClick={() => !isLast && this.move(record.key * 1, 'down')}
            />

            <Divider type="vertical" />
            <Icon type="plus" onClick={() => this.addRow(record.key * 1)} />
            <Divider type="vertical" />
            <Icon
              type="delete"
              theme="twoTone"
              twoToneColor="#eb2f96"
              onClick={() => {
                props.delete(record.key * 1 - 1);
              }}
            />
          </span>
        );
      },
    });
  }

  isEditing = record => record.key === this.state.editingKey;

  move = (index, direction = 'up') => {
    const newData = [...this.state.data];
    const tmp = newData[index - 1];

    if (direction === 'up') {
      newData[index - 1] = newData[index - 2];
      newData[index - 2] = tmp;
      newData[index - 1].key = `${index}`;
      newData[index - 2].key = `${index - 1}`;
    } else {
      newData[index - 1] = newData[index];
      newData[index] = tmp;
      newData[index - 1].key = `${index}`;
      newData[index].key = `${index - 1}`;
    }

    this.setState({ data: newData });
    this.props.update(newData);
  };

  addRow = index => {
    const oldData = [...this.state.data];
    const newRow = Object.assign({}, oldData[index - 1]);
    const newData = [
      ...oldData.slice(0, index),
      newRow,
      ...oldData.slice(index),
    ];
    newData.map((item, i) => {
      if (item.key) delete item.key;
      item.key = `${i + 1}`;
      return item;
    });
    this.setState({ data: newData }, () => {
      this.edit(`${index + 1}`);
    });
    // update(newData);
  };

  save = (form, key) => {
    const { update } = this.props;
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

      update(newData);
    });
  };

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
      this.state = {
        tableData: [],
        columns: [],
      };
      this.update = this.update.bind(this);
      this.delete = this.delete.bind(this);
    }

    getSourceData = () => {
      const { name, formData } = this.props;
      const tableData = formData[name].slice();
      tableData.map((item, index) => (item.key = `${index + 1}`));

      return tableData;
    };

    getColums = () => {
      const { schema } = this.props;
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
      return columns;
    };

    update = value => {
      const { name, onChange } = this.props;
      value.map(item => {
        if (item.key) delete item.key;
        return item;
      });
      onChange(name, value);
    };

    delete = index => {
      const { name, value, onChange } = this.props;
      const _value = [...value];
      _value.splice(index, 1);
      onChange(name, _value);
    };

    render() {
      const EditableFormTable = Form.create()(EditableTable);
      return (
        <EditableFormTable
          columns={this.getColums()}
          dataSource={this.getSourceData()}
          up={this.up}
          down={this.down}
          update={this.update}
          delete={this.delete}
        />
      );
    }
  };
}
