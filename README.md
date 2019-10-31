# babel-react-rmodel

## 背景

> 处理react的表单组件是很麻烦的事，因为我们想要让它变成受控组件，这导致往往处理一个表单组件就要重复代码，所以为了提供r-model的语法糖来应对这种情况，当然这也是就是react版的双向数据绑定


## 如何使用

```javascript

class App extends React.Component {
  constructor(props) {
      super(props);
      this.state={
        inputVale:"🍺🍺hello react-model"
      }
  }

  render() {
    const {inputVale} =this.state
    return (
      <div>
          <h1>I'm {inputVale}</h1>
          <input  type="text" r-model={inputVale} />
      </div>
  )}
}

```


### 编译后

```javascript

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputVale: "hello react-model"
    };
  }

  render() {
    const {
      inputVale
    } = this.state;
    return React.createElement("div", null, React.createElement("h1", null, "I'm ", inputVale), React.createElement("input", {
      type: "text",
      value: inputVale,
      onChange: e => {
        this.setState({
          [`${this.state.inputVale}`]: e.target.value
        });
      }
    }));
  }

}

```

## 支持自定义的onChange事件回调函数

```javascript

class App extends React.Component {
  constructor(props) {
      super(props);
      this.state={
        inputVale:"🍺🍺hello react-model"
      }
  }

  alert=()=>{
     window.alert(this.state.inputVale)
  }

  render() {
    const {inputVale} =this.state
    return (
      <div>
          <h1>I'm {inputVale}</h1>
          <input onChange={this.alert} type="text" r-model={inputVale} />
      </div>
  )}
}

```
### 编译后

```javascript


class App extends React.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "alert", () => {
      window.alert(this.state.inputVale);
    });

    this.state = {
      inputVale: "🍺🍺hello react-model"
    };
  }

  render() {
    const {
      inputVale
    } = this.state;
    return React.createElement("div", null, React.createElement("h1", null, "I'm ", inputVale), React.createElement("input", {
      onChange: e => {
        this.setState({
          [`${this.state.inputVale}`]: e.target.value
        });
        this.alert(e);
      },
      type: "text",
      value: inputVale
    }));
  }

}

```
