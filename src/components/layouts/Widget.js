import Body from './Body';
import React, { PureComponent } from 'react';
import './../../assets/scss/index.scss';
import * as globalActions from "../../actions/globalAction";
import * as accountActions from "../../actions/accountAction";
import * as swapActions from "../../actions/swapAction";
import { getMemo } from "../../services/network_service";
import { connect } from "react-redux";

function mapDispatchToProps(dispatch) {
  return {
    setWidgetMode: () => {dispatch(globalActions.setWidgetMode())},
    setAccountWithBalances: (account) => {dispatch(accountActions.setAccountWithBalances(account))},
    completeSwap: (transactionId, srcAmount, sourceTokenSymbol, destAmount, destSymbol) => {dispatch(swapActions.completeSwap(transactionId, srcAmount, sourceTokenSymbol, destAmount, destSymbol))},
  }
}

class Widget extends PureComponent {
  componentWillMount = () => {
    this.props.setWidgetMode();

    // window.parent.postMessage({ action: 'getAccount', data: {
    //     account: 'kybermainnet',
    //     authority: 'active',
    //     publicKey: 'EOS5bf197zD5rkvnBwTsnK7yhkZLHsvKSPsaomvurehNtVRyfpq9o'
    //   } }, "*");

    window.setInterval(this.sendHeight, 1000);
    window.addEventListener('message', this.watchPostMessages);
  };

  componentWillUnmount = () => {
    window.removeEventListener('message', this.watchPostMessages);
  };

  sendHeight = () => {
    const body = document.getElementsByTagName('body')[0];
    const height = body.clientHeight;

    window.parent.postMessage({ action: 'setHeight', height: height }, "*");
  };

  sendTransaction = (params) => {
    const memo = getMemo(
      params.destPrecision,
      params.destSymbol,
      params.destTokenAccount,
      params.minConversionRate
    );

    window.parent.postMessage({
      action: 'transaction',
      data: {
        account: params.srcTokenAccount,
        authorization: { actor: params.userAccount, permission: 'active' },
        data: { from: params.userAccount, to: params.networkAccount, quantity: params.srcAmount, memo: memo },
        name: 'transfer'
      }
    }, "*");
  };

  watchPostMessages = (event) => {
    const eventData = event.data;
    const action = eventData.action;

    if (action === 'getAccount') {
      let account = eventData.data;
      account.name = account.account;

      this.props.setAccountWithBalances(account);
    } else if (action === 'transaction' && eventData.data.transaction_id) {
      const transactionId = eventData.data.transaction_id;
      this.props.completeSwap(transactionId);
    }
  };

  render() {
    return <Body
      widgetMode={true}
      sendTransaction={this.sendTransaction}
    />
  }
}

export default connect(() => {return {}}, mapDispatchToProps)(Widget);
