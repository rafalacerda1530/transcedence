

function handleLoginClick() {
    const url = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e4c7b8cd4fb31c268132af823110ef8bdbf90e2df97baf4c1fe0f4a6f93e110b&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FcallBack&response_type=code'
    window.location.href = url;
    return
}

export default handleLoginClick
