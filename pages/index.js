

import Web3Modal from "web3modal";
import { Canvas } from '@react-three/fiber';
import { Sky, MapControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { providers, Contract,utils } from "ethers";
import { Suspense,useRef, useState,useEffect } from 'react'
import styles from '../styles/Home.module.css'

import { CONTRACT_ADDRESS,CONTRACT_ABI } from '../contracts';



// Import Components
import Plane from '../components/Plane';
import Plot from '../components/Plot';
import Building from '../components/Building';


export default function Home() {

    const [walletConnected,setWalletConnected] = useState(false);
    const [loading , SetLoading] = useState(false);
    const [cost,SetCost] = useState(0);
    const [buildings,SetBuildings] = useState(null);
    const [hasOwner,SetHasOwner] = useState(false);
    const [landId , SetLandId] = useState(null);
    const [landName,SetLandName] = useState(null);
    const [landOwner , SetLandOwner] = useState(null);
    const web3ModalRef = useRef();

    const getProviderOrSigner = async(needSigner = false) =>
    {
      try
      {
         const provider = await web3ModalRef.current.connect();
         const web3Provider = new providers.Web3Provider(provider);
         const {chainId} = await web3Provider.getNetwork();

         if(chainId !=4)
         {
           window.alert("Connect to Rinkeby Network");
           throw new Error("Change network to Rinkeby");
         }

         if(needSigner === true)
         {
           const signer =  web3Provider.getSigner();
           return signer;
         }

         return web3Provider;
        }
        
      catch(err)
      {
        console.log(err);
      }
    }


    const BuyLand = async(_id) =>
    {
     try{
       const signer = await getProviderOrSigner(true);
       const MintContract = new Contract(
         CONTRACT_ADDRESS,
         CONTRACT_ABI,
         signer
       );
       const tx = await MintContract.mint(_id,{
         value: utils.parseEther("0.1")
       });
       SetLoading(true);
       await tx.wait();
       SetLoading(false);
       const buildings = await MintContract.getBuildings();
       SetBuildings(buildings);
       SetLandName(buildings[_id-1].name);
       SetLandOwner(buildings[_id-1].owner);
       SetHasOwner(true);
     }catch(err)
     {
       console.error(err);
     } 
    }

    const renderButton = () =>
    {
        if(walletConnected === false)
        {
          return(
            <button onClick={ConnectWallet} className={styles.button}>
                Connect your Wallet
            </button>
          )
        }

  
    }

    const GetBuildings = async() =>
    {
      try{

        const provider = await getProviderOrSigner();
        const BuildingsContract = new Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );
        const buildings = await BuildingsContract.getBuildings();
        SetBuildings(buildings);
      }catch(err)
      {
        console.error(err);
      }
    }

    const ConnectWallet =  async() =>
    {
      try
      {
         await getProviderOrSigner();
         setWalletConnected(true);
         await GetBuildings();
      }
      catch(err)
      {
        console.log(err);
      }  
    }


    useEffect(()=>{

      if(walletConnected === false)
      {
         web3ModalRef.current = new Web3Modal({
               network:"rinkeby",
               providerOptions:{},
               disableInjectedProvider:false,
         });
        }
       

    },[walletConnected]);




if(walletConnected === true)
{
  return (
    <div>
         <div className={styles.topnavbar}>
             <h1>Hi Welcome to Metaverse</h1>
         </div>  

         <Canvas camera={{ position: [0, 0, 30], up: [0, 0, 1], far: 10000 }}>
				<Suspense fallback={null}>
					<Sky distance={450000} sunPosition={[1, 10, 0]} inclination={0} azimuth={0.25} />

					<ambientLight intensity={0.5} />

					{/* Load in each cell */}
					<Physics>
						{buildings && buildings.map((building, index) => {
								return (
									<Plot
										key={index}
										position={[building.posX, building.posY, 0.1]}
										size={[building.sizeX, building.sizeY]}
										landId={index + 1}
										landInfo={building}
										setLandName={SetLandName}
										setLandOwner={SetLandOwner}
										setHasOwner={SetHasOwner}
										setLandId={SetLandId}
									/>
								)
							})
            }
					</Physics>

					<Plane />
				</Suspense>
				<MapControls />
			</Canvas>

			{landId && (
				<div className="info">
					<h1 className="flex">{landName}</h1>

					<div className='flex-left'>
						<div className='info--id'>
							<h2>ID</h2>
							<p>{landId}</p>
						</div>

						<div className='info--owner'>
							<h2>Owner</h2>
							<p>{landOwner}</p>
						</div>

						{!hasOwner && (
							<div className='info--owner'>
								<h2>Cost</h2>
								<p>{`${cost} ETH`}</p>
							</div>
						)}
					</div>

					{!hasOwner && (
						<button onClick={() => BuyLand(landId)} className='button info--buy'>Buy Property</button>
					)}
				</div>
         )}
  </div>   
  )
}

else
{
    return(
      <div className={styles.center}>
      {renderButton()}
      </div>
    )
}
}
