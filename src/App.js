import React, { Component } from 'react';
import './App.css';
import { List, Avatar, Button, Spin, Layout, Menu, Breadcrumb, Icon } from 'antd/lib';
import axios from 'axios'
import { GoogleLogin } from 'react-google-login';
import reqwest from 'reqwest';
import _ from 'lodash'
import firebase from 'firebase'
import { OauthSender, OauthReceiver } from 'react-oauth-flow';
import qs from 'qs'
const http = require("https");
const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;
const fakeDataUrl = 'https://randomuser.me/api/?results=5&inc=name,gender,email,nat&noinfo';

// const API_KEY = '659997013090-n2k8p7lvhjo80fkvfl9pbpc7cu9hifmp.apps.googleusercontent.com'; //server
const API_KEY = '';
const accessTokenImg = ""
const userImg = ""

const config = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  clientId: API_KEY
};
firebase.initializeApp(config);

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      loadingMore: false,
      showLoadingMore: true,
      data: [],
      token: "",
      nextToken: "",
      page: 0
    }
  }
  
  componentDidMount() {
    this.setState({
      loading: false,
      data: []
    });
  }


  responseGoogleAlbum = (response) => {
    console.log(response)

    this.setState({
      token: response.accessToken
    })

    console.log(response.accessToken)

    axios.get("https://photoslibrary.googleapis.com/v1/sharedAlbums", {
      method: 'GET',
      headers: { 
          "Content-type": "application/json",
          "Authorization": "Bearer " + response.accessToken
      }
    }).then(response => {
      console.log(response.data.nextPageToken)
      this.setState({
        nextToken: response.data.nextPageToken
      })

      if (Object.keys(response.data.sharedAlbums).length) {
        this.setState({
          loading: false,
          data: response.data.sharedAlbums
        })
      }
    }).catch((error) => {
      console.log(error)
    })

  }

  loadmoreResponseGoogleAlbum = (token, nextToken) => {
    axios.get("https://photoslibrary.googleapis.com/v1/sharedAlbums?pageToken="+nextToken, {
      method: 'GET',
      headers: { 
          "Content-type": "application/json",
          "Authorization": "Bearer " + token
      }
    }).then(response => {
      console.log(nextToken)
      if (Object.keys(response.data.sharedAlbums).length) {
        const data = this.state.data.concat(response.data.sharedAlbums);
        this.setState({
          data,
          loadingMore: false,
          nextToken: !_.isUndefined(response.data.nextPageToken) ? response.data.nextPageToken : ""
        }, () => {
          window.dispatchEvent(new Event('resize'));
        });
      }
    }).catch((error) => {
      console.log(error)
    })
    
  }

  responseGoogle = (albumId, title) => {
    const { token } = this.state
    axios.post("https://photoslibrary.googleapis.com/v1/mediaItems:search", {
      albumId: albumId
    }, {
      method: 'POST',
      headers: { 
          "Content-type": "application/json",
          "Authorization": "Bearer " + token
      }
    }).then(response => {
      console.log(response)
      let newData = []
      let sortData = []
      let dataFirebase = []
      let keyFirebase = _.replace(title, 'OP', '')
      _.map(response.data.mediaItems, (value, index) => {
        let filename = _.replace(value.filename, '.jpeg', '')
        newData.push({
          url: `${value.baseUrl}=w${value.mediaMetadata.width}-h${value.mediaMetadata.height}-no`,
          id: Number(filename)
        })
      })

      sortData = _.sortBy(newData, [function(o) { return o.id; }]);
      _.map(sortData, (v, i) => {
        dataFirebase[i] = _.pick(v, ['url']);
      })
      console.log(dataFirebase)
      console.log(keyFirebase)
      // firebase.database().ref(`manga/detail/0/chapter/${Number(keyFirebase) - 1}`).update({
      //   chapter: Number(keyFirebase)
      // })
      // firebase.database().ref(`manga/feed/0/${Number(keyFirebase) - 1}`).update({
      //   chapter: keyFirebase,
      //   createAt: new Date().getTime(),
      //   gallery: dataFirebase
      // })
    }).catch((error) => {
      console.log(error)
    })
  }

  getData = (callback) => {
    reqwest({
      url: fakeDataUrl,
      type: 'json',
      method: 'get',
      contentType: 'application/json',
      success: (res) => {
        console.log(res)
        callback(res);
      },
    });
  }

  onLoadMore = () => {
    const { token, nextToken } = this.state
    this.setState({
      loadingMore: true,
    });
    this.loadmoreResponseGoogleAlbum(token, nextToken)
  }

  loadMoreImgUr = (id, title) => {
    axios.get(`https://api.imgur.com/3/account/${userImg}/album/${id}`, {
      method: 'GET',
      headers: { 
        "Authorization": "Bearer "+accessTokenImg
      }
    }).then(response => {
      console.log(response.data)
      let newData = []
      let sortData = []
      let dataFirebase = []
      let keyFirebase = _.replace(title, 'OP', '')
      if (Object.keys(response.data).length) {
        _.map(response.data.data.images, (value, index) => {
          newData.push({
            url: value.link,
            id: Number(value.name)
          })
        })

        sortData = _.sortBy(newData, [function(o) { return o.id; }]);
        _.map(sortData, (v, i) => {
          dataFirebase[i] = _.pick(v, ['url']);
        })
        console.log(dataFirebase)
        console.log(keyFirebase)

        firebase.database().ref(`manga/detail/0/chapter/${Number(keyFirebase) - 1}`).update({
          chapter: Number(keyFirebase)
        })
        firebase.database().ref(`manga/feed/0/${Number(keyFirebase) - 1}`).update({
          chapter: keyFirebase,
          createAt: new Date().getTime(),
          gallery: dataFirebase
        })
      }
      
    }).catch((error) => {
      console.log(error)
    })
  }

  callImageUr = () => {
    const { page } = this.state
    console.log('test')
    axios.get(`https://api.imgur.com/3/account/${userImg}/albums/${page}`, {
      method: 'GET',
      headers: { 
        "Authorization": "Bearer "+accessTokenImg
      }
    }).then(response => {
      console.log(response.data)
      if (Object.keys(response.data).length) {
        console.log(response.data.data)
        this.setState({
          loading: false,
          data: response.data.data,
          page: page + 1
        })
      }
      
    }).catch((error) => {
      console.log(error)
    })
  }

  loadMoreContent = () => {
    const { page } = this.state
    this.setState({
      loadingMore: true
    })
    axios.get(`https://api.imgur.com/3/account/${userImg}/albums/${page}`, {
      method: 'GET',
      headers: { 
        "Authorization": "Bearer "+accessTokenImg
      }
    }).then(response => {
      console.log(response.data)
      if (Object.keys(response.data).length) {
        const data = this.state.data.concat(response.data.data);
        this.setState({
          data,
          loadingMore: false,
          page: this.state.page + 1
        }, () => {
          window.dispatchEvent(new Event('resize'));
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  createAlbum = () => {

    axios.post("https://api.imgur.com/3/album", {
      ids: null,
      title: "OP16",
      description: "",
      cover: null
    }, {
      method: 'GET',
      headers: { 
        "Authorization": "Bearer "+accessTokenImg,
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
      }
    }).then(response => {
      console.log(response)

      // console.log(response.data)
      // if (Object.keys(response.data).length) {
      //   console.log(response.data.data)
      //   this.setState({
      //     loading: false,
      //     data: response.data.data
      //   })
      // }
      
    }).catch((error) => {
      console.log(error)
    })
  }

  handleSuccess = async (accessToken, { response, state }) => {
    console.log('Successfully authorized', response , response);

  };

  handleError = error => {
    console.error('An error occured');
    console.error(error.message);
  };

  render() {
    const { loading, loadingMore, showLoadingMore, data } = this.state;
    const loadMore = showLoadingMore ? (
      <div style={{ textAlign: 'center', marginTop: 12, height: 32, lineHeight: '32px' }}>
        {loadingMore && <Spin size="large"  />}
        {!loadingMore  && Object.keys(data).length ? <Button onClick={this.loadMoreContent}>loading more</Button> : null}
      </div>
    ) : null;

    return (
          <Layout>
          <Header className="header">
            <div className="logo" />
            <Menu
              theme="dark"
              mode="horizontal"
              defaultSelectedKeys={['2']}
              style={{ lineHeight: '64px' }}
            >
              <Menu.Item key="1">Manga</Menu.Item>
              <Menu.Item key="2">Anime</Menu.Item>
              <Menu.Item key="3">Addict</Menu.Item>
            </Menu>
          </Header>
          <Content style={{ padding: '0 50px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>OPT Addict</Breadcrumb.Item>
            </Breadcrumb>
            <Layout style={{ padding: '0px 0', background: '#fff' }}>
              <Sider width={200} style={{ background: '#fff' }}>
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['1']}
                  defaultOpenKeys={['sub1']}
                  style={{ height: '100%' }}
                  theme="dark"
                >
                  <SubMenu key="sub1" title={<span><Icon type="user" />Manga</span>}>
                    <Menu.Item key="1">option1</Menu.Item>
                  </SubMenu>
                  <SubMenu key="sub2" title={<span><Icon type="laptop" />Anime</span>}>
                    <Menu.Item key="5">option5</Menu.Item>
                  </SubMenu>
                  <SubMenu key="sub3" title={<span><Icon type="notification" />Addict</span>}>
                    <Menu.Item key="9">option9</Menu.Item>
                  </SubMenu>
                </Menu>
              </Sider>
              <Content style={{ padding: '24px 24px', minHeight: 280 }}>
                  {/* <GoogleLogin
                    clientId={ API_KEY }
                    buttonText="Sync Google"
                    onSuccess={this.responseGoogleAlbum}
                    onFailure={this.responseGoogleAlbum}
                    scope={ 'https://www.googleapis.com/auth/photoslibrary' }  
                  /> */}

                  <Button onClick={this.createAlbum}>Create Album</Button>
                  <Button onClick={this.callImageUr}>Connect</Button>

                  <p></p><p></p>
                    <List
                      className="demo-loadmore-list"
                      loading={loading}
                      itemLayout="horizontal"
                      loadMore={loadMore}
                      dataSource={data}
                      renderItem={item => (
                        <List.Item actions={[<a onClick={() => this.loadMoreImgUr(item.id, item.title)}>Sycn to firebase</a>, <a>delete</a>]}>
                          <List.Item.Meta
                            avatar={<Avatar src={ "https://avatarfiles.alphacoders.com/829/82986.jpg" } />}
                            title={item.title}
                            description=""
                          />
                          <div>onepiece</div>
                        </List.Item>
                      )}
                    />
              </Content>
            </Layout>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            OPT Addict Back end 2018 | Application for Android
          </Footer>
        </Layout>
    );
  }
}
export default App
