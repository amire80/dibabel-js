import json
from dataclasses import dataclass
from pathlib import Path

import mwoauth
from dibabel.QueryCache import QueryCache
from dibabel.SiteCache import SiteCache
from quart import Quart, send_file, jsonify, session, flash
from quart import redirect, request, url_for

app = Quart(__name__,
            static_url_path='',
            static_folder='../dibabel-js/build')

app.config['JSON_SORT_KEYS'] = False
app.config['JSON_AS_ASCII'] = False

cache = QueryCache(SiteCache('www.mediawiki.org', '../cache'))


@dataclass
class OauthSecret:
    url: str
    consumer_token: str
    secret_token: str


with Path('../secret.json').open('r', encoding='utf-8') as stream:
    secrets = OauthSecret(**json.load(stream))


def create_consumer_token():
    return mwoauth.ConsumerToken(secrets.consumer_token, secrets.secret_token)


@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route("/")
async def index():
    return await send_file('../dibabel-js/build/index.html')


@app.route("/data")
async def data():
    return jsonify(await cache.get_data())


@app.route("/page/<qid>/<site>")
async def page(qid: str, site: str):
    return jsonify(await cache.get_page(qid, site))


@app.route('/login')
def login():
    try:
        redirect_url, request_token = mwoauth.initiate(secrets.url, create_consumer_token())
    except:
        app.logger.exception('mwoauth.initiate failed')
        return redirect(url_for('index'))
    else:
        session['request_token'] = dict(zip(request_token._fields, request_token))
        return redirect(redirect_url)


@app.route('/userinfo')
def userinfo():
    return jsonify(mwoauth.identify(secrets.url, create_consumer_token(), session['access_token']))


@app.route('/oauth-callback')
def oauth_callback():
    if 'request_token' not in session:
        flash('OAuth callback failed, do you have your cookies disabled?')
        return redirect(url_for('index'))

    consumer_token = create_consumer_token()
    try:
        access_token = mwoauth.complete(
            secrets.url,
            consumer_token,
            mwoauth.RequestToken(**session['request_token']),
            request.query_string)

        identity = mwoauth.identify(secrets.url, consumer_token, access_token)
    except:
        flash('OAuth callback caused an exception, aborting')
        app.logger.exception('OAuth callback failed')
    else:
        session['access_token'] = dict(zip(access_token._fields, access_token))
        session['username'] = identity['username']

    return redirect(url_for('index'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run()
