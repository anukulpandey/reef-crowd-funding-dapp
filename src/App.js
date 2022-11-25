import React, { useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract } from "ethers";
import CrowdFunding from "./contracts/CrowdFunding.json";
import CrowdFundingToken from "./contracts/CrowdFundingToken.json";
import Uik from "@reef-defi/ui-kit";
import { faArrowsRotate ,faWandMagicSparkles,faTrash,faCoins,faPaperPlane,faTape,faSackDollar,faBoltLightning} from "@fortawesome/free-solid-svg-icons";

const FactoryAbi = CrowdFunding.abi;
const factoryContractAddress = CrowdFunding.address;

const TokenFactoryAbi = CrowdFundingToken.abi;
const TokenfactoryContractAddress = CrowdFundingToken.address;

const URL = "wss://rpc-testnet.reefscan.com/ws";

function App() {
	const [signer, setSigner] = useState();
	const [isWalletConnected, setWalletConnected] = useState(false);
	const [connecting, setConnecting] = useState(true);
	const [accountAddress, setAccountAddress] = useState();
	const [startDate, setStartDate] = useState();
	const [endDate, setEndDate] = useState();
	const [startTime, setStartTime] = useState();
	const [endTime, setEndTime] = useState();
	const [value, setValue] = useState(50);
	const [balance, setBalance] = useState(0.00001);
	const [isOpen, setOpen] = useState(false);
	const [eventId,setEventId] = useState(0);
	const [eventDetails,setEventDetails]=useState({
		"msg":"No events found"
	});

	const checkExtension = async () => {
		let allInjected = await web3Enable("Reef");
		setConnecting(false);

		if (allInjected.length === 0) {
			return false;
		}

		let injected;
		if (allInjected[0] && allInjected[0].signer) {
			injected = allInjected[0].signer;
		}

		const evmProvider = new Provider({
			provider: new WsProvider(URL),
		});

		evmProvider.api.on("ready", async () => {
			const allAccounts = await web3Accounts();

			allAccounts[0] &&
				allAccounts[0].address &&
				setWalletConnected(true);

			console.log(allAccounts);

			const wallet = new Signer(
				evmProvider,
				allAccounts[0].address,
				injected
			);
			const deployerAddress = await wallet.getAddress();
			setAccountAddress(deployerAddress);

			// Claim default account
			if (!(await wallet.isClaimed())) {
				console.log(
					"No claimed EVM account found -> claimed default EVM account: ",
					await wallet.getAddress()
				);
				await wallet.claimDefaultAccount();
			}

			setSigner(wallet);
		});
	};

	const checkSigner = async () => {
		if (!signer) {
			await checkExtension();
		}
		return true;
	};

	const mintTokens = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			TokenfactoryContractAddress,
			TokenFactoryAbi,
			signer
		);
		console.log(tokenContract);
		const result = await tokenContract.mint(accountAddress, 100);
		console.log(result);
		await getBalance();
		await approveTransaction();
	};

	const getBalance = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			TokenfactoryContractAddress,
			TokenFactoryAbi,
			signer
		);

		const result = await tokenContract.balanceOf(accountAddress);
		console.log('balance : ' + result.toNumber());
		setBalance(result.toNumber());
	};


	const approveTransaction = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			TokenfactoryContractAddress,
			TokenFactoryAbi,
			signer
		);
		if (balance != 0.00001) {
			const result = await tokenContract.approve(factoryContractAddress, 10000);
			console.log("approved balance")
			console.log(result);
		}
	};

	const fetchCF = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		console.log(crowdFundingContract);
	};

	const launchCF = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		const eventStart = new Date(startDate + ' ' + startTime)
		const eventEnd = new Date(endDate + ' ' + endTime)
		let result;
		try {
			result = await crowdFundingContract.launch(value, (eventStart.getTime() / 1000), (eventEnd.getTime() / 1000));
			
		} catch (error) {
			alert("💔 Error encountered due to any of these reasons\n 1. Launching time can never be before current time\n 2. The ending time can be before starting time")
		}
		console.log("Launching event")
		alert("Event Launched Successfully!")
		console.log(result);
		
	};

	const fetchCampaigns = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);

		const result = await crowdFundingContract.campaigns(eventId);
		console.log(result);
		if(result['creator']==='0x0000000000000000000000000000000000000000'){
			setEventDetails({
				"msg":"No events found"
			});
		}else{

			let eDetailsObj = {};
			eDetailsObj['creator']=result['creator'];
			let stDate = new Date(result['startAt']*1000)
			console.log();
			console.log();
			console.log();
			console.log();
			console.log();
			eDetailsObj['startAt']= 'on '+stDate.getDate()+'/'+stDate.getMonth()+'/'+stDate.getFullYear()+' at '+stDate.getHours()+':'+stDate.getMinutes();
			let enDate = new Date(result['endAt']*1000);
			eDetailsObj['endAt']='on '+enDate.getDate()+'/'+enDate.getMonth()+'/'+enDate.getFullYear()+' at '+enDate.getHours()+':'+enDate.getMinutes();
			eDetailsObj['goal']=(result['goal']).toNumber();
			eDetailsObj['raised']=(result['pledged']).toNumber();
			setEventDetails(eDetailsObj);
			console.log(eventDetails);

		}
	};

	const cancelCampaign = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
			let result;
			try {
				result = await crowdFundingContract.cancel(eventId);
			   console.log(result);
			   alert("Successfully cancelled the event")
			} catch (error) {
				alert("💔 Error encountered due to any of these reasons\n 1. You are not creator of the event\n 2. You can cancel an event which already ended")
			}
	};

	const claimFunds = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
			let result;
			try {
				result = await crowdFundingContract.claim(eventId);
			   console.log(result);
			   alert("Successfully claimed goal funds!");
			   Uik.dropMoney()
			   await getBalance();
			} catch (error) {
				alert("💔 Error encountered due to any of these reasons\n 1. You might not be creator of the event\n 2. Amount raised is less than the goal\n 3. Event has not ended yet");
			}
		
	};

	const pledge = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		await approveTransaction();
			let result;
			try {
				result = await crowdFundingContract.pledge(eventId, 10);
			   console.log(result);
			   alert("✅ Successfully sent 10 Tokens")
			   Uik.dropConfetti() 
			} catch (error) {
				alert("💔 Error encountered due to one of the following reasons\n 1. Event has already ended")
			}
	};
	const unpledge = async () => {
		await checkSigner();
		const crowdFundingContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		let result;
		try {
			result = await crowdFundingContract.unpledge(eventId, 10);
			console.log(result);
			alert("✅ Successfully withdrawn 10 tokens")
		} catch (error) {
			alert("💔 Error encountered due to one of the following reasons\n 1. You did not send any money\n 2. Event has already ended")
		}
	};

	const handleChange = (e) => {
		if (e.target.name == "startDate") {
			setStartDate(e.target.value);
		} else if (e.target.name == "endDate") {
			setEndDate(e.target.value);
		} else if (e.target.name == "startTime") {
			setStartTime(e.target.value);
		} else {
			setEndTime(e.target.value);
		}
	}

	return (
		<Uik.Container>	
			
			<Uik.Container vertical>
			{isWalletConnected?(
				
				<Uik.Container className="margin2x" vertical flow="end">
					
					<Uik.Container flow='end'  className="margin2x">
				<Uik.Tooltip text='refresh' position='left'>
				<Uik.Button
					icon={faArrowsRotate} size='large'
					onClick={getBalance}
				/>
				</Uik.Tooltip>
				<Uik.ReefAmount value={balance} />
					</Uik.Container>
		
					</Uik.Container>
			):(
<Uik.Container flow='end' className="margin2x">
					{connecting? (<Uik.Button
								text="Connect Wallet"
								onClick={checkExtension}
								icon={faSackDollar}
							/>):(
								<Uik.Button text='Button' loading size='large' loader='fish'/>
							)}
							</Uik.Container>
			)}
				<Uik.Container vertical>
					<Uik.Container>
					<Uik.ReefLogo /><Uik.Text text="Crowd" type="headline" />
					<Uik.Text text="Funding" type="headline" />
					</Uik.Container>
					<Uik.Tag color="purple" text="The only crowd funding dApp , you will ever need"/>
				</Uik.Container>
				{isWalletConnected ? (
					<>
				<br />
					<Uik.Container>
						<Uik.Container vertical>
							<Uik.Container vertical>
							<Uik.Divider text='Claim Free CFTs'className="uparHoja" />
					<Uik.ActionButton text="Claim" icon={<Uik.ReefSign/>} onClick={mintTokens}/>
							</Uik.Container>

						</Uik.Container>
						<Uik.Card title='🐠 together we can make a difference' titlePosition='center'>
						<Uik.Divider text='REEF' />
						<Uik.Container vertical>
							<Uik.Container>
								<input type="date" name="startDate" className="dt" id="startDate" onChange={e => handleChange(e)} required />
								<input type="time" name="startTime" className="dt"  id="startTime" onChange={e => handleChange(e)} required />
							</Uik.Container>
							<Uik.Container>
								<input type="date" name="endDate" className="dt"  id="endDate" onChange={e => handleChange(e)} required />
								<input type="time" name="endTime" className="dt"  id="endTime" onChange={e => handleChange(e)} required />
							</Uik.Container>
							
							<br />
							<>
								<Uik.Slider
									value={value}
									onChange={e => setValue(e)}
									tooltip={value + ' REEFs'}
									helpers={[
										{ position: 0, text: "0" },
										{ position: 25 },
										{ position: 50, text: "50" },
										{ position: 75, },
										{ position: 100, text: "100" },
									]}
								/>
							</>
							<br />
<Uik.Container>
	<br />
<Uik.Button
							text="Cancel"
							onClick={cancelCampaign}
							icon={faTrash}
							danger
						/>
							<Uik.Button
								text="Launch Event"
								onClick={launchCF}
								icon={faWandMagicSparkles}
							/>
							<Uik.Button
							text="Claim Funds"
							onClick={claimFunds}
							icon={faCoins}
							fill/>
							
						</Uik.Container>
						</Uik.Container>
						</Uik.Card>

						<Uik.Container vertical>
					
							 <Uik.Divider text='All transactions' className="neecheHoja"/>
<Uik.Tag color="pink" text="Selected Campaign ID"/>{eventId}
						<Uik.Button
							text="Fetch campaign details"
							onClick={()=>setOpen(true)}
						/>
						<Uik.Modal
    title='Enter ID to fetch details'
    isOpen={isOpen}
    onClose={() => setOpen(false)}
    onOpened={() => {}}
    onClosed={() => {}}
    footer={
      <>
        <Uik.Button text='Close' onClick={() => setOpen(false)}/>
        <Uik.Button text='Find' fill onClick={fetchCampaigns} icon={faBoltLightning}/>
      </>
    }
  >
    <Uik.Input 
	value={eventId}
    onInput={e => setEventId(e.target.value)}
	/>
	{eventDetails['msg']?eventDetails['msg']:(
		<>
		<p>Launched By : {eventDetails['creator']}</p> 
		<p>Started at : {eventDetails['startAt']}</p> 
		<p>Ending at : {eventDetails['endAt']}</p> 
		<p>Status : {eventDetails['raised']}/{eventDetails['goal']}</p>
		</>
	)}
	
  </Uik.Modal>
						<Uik.Container>
							


						<Uik.ActionButton text="Transfer" icon={faPaperPlane} onClick={pledge} />
						<Uik.ActionButton text="Withdraw" icon={faTape} onClick={unpledge} color="red"/>
						</Uik.Container>
						
</Uik.Container>
					</Uik.Container>
					</>
				) : (
					<>
						<Uik.Container vertical className="container">
						<Uik.Text text='Introduction' type='lead'/>
						<Uik.Text text="It's a crowdfunding application where artists or anyone can list their campaign and get funded by people in a given number of days, once done they get the fund.
" type='light'/>
<br />
						<Uik.Text text='Features of dApp' type='lead'/>
						<Uik.Text text="User can launch a campaign & others can pledge , transfer their tokens to the campaign.
" type='light'/>
						<Uik.Text text="After the campaign ends, campaign creator can claim the funds if total amount pledged is more than the campaign goal.
" type='light'/>
						<Uik.Text text="Otherwise if campaign doesn't reach the goal , users can take back their tokens they sent.
" type='light'/>
						<Uik.Text text="Campaign creator can cancel the campaign if it hasn't started.
" type='light'/>
						<Uik.Text text="Users can withdraw their funds before event ends as well as after event ends if the goal isn't met.
" type='light'/>
							<br />
							<Uik.Text text='How to use this dApp?' type='lead'/>
						
<Uik.Text text="It depends if you want to raise funds or you want to donate funds in a crowd funding program. So let's discuss both. 
" type='light'/>
<Uik.Text text="First thing you must do is, claim some free CFTs. CFT is token which we are using here. [Crowd Funding Token]
" type='light'/>
<Uik.Container>
<Uik.Tag text="Creator"/><Uik.Text text="Select the event start & end timings. Click on launch event. Thats it.  
" type='light'/>
</Uik.Container>
<Uik.Container>
<Uik.Tag text="Participant"/><Uik.Text text="Click on 'fetch event details' button . Modal will be popped , enter event ID. Close modal & click on Transfer .
" type='light'/>
</Uik.Container>
<br /><br />
						</Uik.Container>
					</>
				)}
			</Uik.Container>
		</Uik.Container>
	);
}

export default App;
