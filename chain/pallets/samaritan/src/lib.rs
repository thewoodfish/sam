#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet] 
pub mod pallet {
	use frame_support::dispatch::DispatchResult;
	use frame_support::{pallet_prelude::*, BoundedVec};
	use frame_system::{pallet_prelude::*};

	use frame_support::traits::{tokens::ExistenceRequirement, Currency, UnixTime};
	use frame_support::transactional;

	#[cfg(feature = "std")]
	use frame_support::serde::{Deserialize, Serialize};

	use scale_info::prelude::vec::Vec;

	// Handles our pallet's currency abstraction
    type AccountOf<T> = <T as frame_system::Config>::AccountId;
    // type BalanceOf<T> = 
    //     <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct SignInDetail<T: Config> {
		pub ip: BoundedVec<u8, T::MaxIPAddress>,
		pub time: u64
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct Samaritan<T: Config> {
		pub pseudoname: BoundedVec<u8, T::MaxPseudoNameLength>,
		pub cid: BoundedVec<u8, T::MaxCIDLength>
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct SamApp<T: Config> {
		pub name: BoundedVec<u8, T::MaxAppNameLength>,
		pub developer: T::AccountId,
		pub permissions: BoundedVec<u8, T::MaxPermissionsLength>
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct Reviews {
		pub yays: u32,
		pub nays: u32,
		// pub accounts: BoundedVec<T::AccountId, T::MaxRegulators>
	}

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config {
		/// Because this pallet emits events, it depends on the runtime's definition of an event.
		type Event: From<Event<Self>> + IsType<<Self as frame_system::Config>::Event>;
        // type Currency: Currency<Self::AccountId>;
		type TimeProvider: UnixTime;

		type CustomOrigin: EnsureOrigin<Self::Origin>;
 
        #[pallet::constant]
        type MaxIPAddress: Get<u32>;

		#[pallet::constant]
        type MaxPseudoNameLength: Get<u32>;

		#[pallet::constant]
        type MaxCIDLength: Get<u32>;

		#[pallet::constant]
        type MaxAppNameLength: Get<u32>;

		#[pallet::constant]
        type MaxAppCIDLength: Get<u32>;

		#[pallet::constant]
        type MaxPermissionsLength: Get<u32>;

	}

	#[pallet::pallet]
	#[pallet::generate_store(pub(super) trait Store)]
	pub struct Pallet<T>(_);

	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// a Samaritan just signed in
        SignIn(T::AccountId, u64, Vec<u8>),
		/// a new Samaritan was just created
		Created(T::AccountId, u64, Vec<u8>),
		/// the Samaritan state has been modified
		StateModified(T::AccountId, Vec<u8>),
		/// update Samaritan details
		UpdateSamaritan(T::AccountId, Vec<u8>, Vec<u8>),
		/// app submitted for verification
		AppSubmitted(T::AccountId, Vec<u8>, Vec<u8>, Vec<u8>),
		/// regulator has passed a vote
		RegulatorVoteCasted(bool),
		/// vote for app has been concluded
		AppVoteConcluded(Vec<u8>, u32, u32),
		/// app has been added to the ability pool
		AddedToAbilityPool(Vec<u8>)

	}

	#[pallet::storage]
    #[pallet::getter(fn sign_ins)]
    pub(super) type SignIns<T: Config> = StorageMap< _, Twox64Concat, T::AccountId, SignInDetail<T>>;


	#[pallet::storage]
    #[pallet::getter(fn samaritan)]
    pub(super) type SamPool<T: Config> = StorageMap< _, Twox64Concat, T::AccountId, Samaritan<T>>;

	#[pallet::storage]
    #[pallet::getter(fn temp_pool)]
    pub(super) type TempPool<T: Config> = StorageMap< _, Twox64Concat, BoundedVec<u8, T::MaxAppCIDLength>, SamApp<T>>;

	#[pallet::storage]
    #[pallet::getter(fn ability_pool)]
    pub(super) type AbilityPool<T: Config> = StorageMap< _, Twox64Concat, BoundedVec<u8, T::MaxAppCIDLength>, SamApp<T>>;

	#[pallet::storage]
    #[pallet::getter(fn votes)]
    pub(super) type RevBox<T: Config> = StorageMap< _, Twox64Concat, BoundedVec<u8, T::MaxAppCIDLength>, Reviews>;

	#[pallet::storage]
	#[pallet::getter(fn app_count)]
	pub type AppsCount<T: Config> = StorageValue<_, u32>;


	// Errors inform users that something went wrong.
	#[pallet::error]
	pub enum Error<T> {
		/// Samaritan is not existent
        SamaritanNotExist,

		/// IP address length is more than normal
		IPAddressOverflow,

		/// CID address length is more than normal
		CIDAddressOverflow,

		/// Pseudoname length is more than normal
		PseudoNameOverflow,

		/// App name length is more than cap
		AppNameLengthOverflow,

		/// App permissions length is more than cap
		PermissionsLengthOverflow,

		/// CID length of app binary is more than cap
		AppCIDOverflow,

		/// Regulator has cast vote previously
		DuplicateVoteCast,

		/// App does not exist
		AppDoesNotExist,

		/// App exists in ability pool already
		AppExistsInPool
		
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {
		/// record latest import/creation of Samaritan
		#[pallet::weight(1000)]
		pub fn sign_in(origin: OriginFor<T>, ip_addr: Vec<u8>) -> DispatchResult
		{
			// first check for if account id is present
			let sender = ensure_signed(origin)?;
			let user_id = sender.clone();

			// check for overflow
			let ip_address: BoundedVec<_, T::MaxIPAddress> =
				ip_addr.clone().try_into().map_err(|()| Error::<T>::IPAddressOverflow)?;

			// select user
			let detail = SignIns::<T>::get(&user_id);

			let mut now: u64 = 0;

			if let Some(_sd) = detail {
				now = Self::change_si(&user_id, &ip_address);
			} else {
				now = Self::new_si(&user_id, &ip_address);

				// user was just created
				Self::deposit_event(Event::Created(sender, now, ip_addr.clone()));
			}

            Self::deposit_event(Event::SignIn(user_id, now, ip_addr.clone()));

			Ok(())

		}
	
		#[pallet::weight(1000)]
		pub fn change_detail(origin: OriginFor<T>, pseudo: Vec<u8>, cid: Vec<u8>) -> DispatchResult
		{
			let sender = ensure_signed(origin)?;

			// check for overflow
			let ncid: BoundedVec<_, T::MaxCIDLength> =
				cid.clone().try_into().map_err(|()| Error::<T>::CIDAddressOverflow)?;

			let psn: BoundedVec<_, T::MaxPseudoNameLength> =
				pseudo.clone().try_into().map_err(|()| Error::<T>::PseudoNameOverflow)?;

			// select samaritan
			let sam = SamPool::<T>::get(&sender);

			if let Some(_sam) = sam {
				Self::update_sam(&sender, &psn, &ncid);
			} else {
				Self::new_sam(&sender, &psn, &ncid);
			}

            Self::deposit_event(Event::UpdateSamaritan(sender, pseudo, cid));

			Ok(())
		}

		#[pallet::weight(1000)]
		pub fn upload_app(origin: OriginFor<T>, app_name: Vec<u8>, cid: Vec<u8>, perms: Vec<u8>) -> DispatchResult
		{
			let sender = ensure_signed(origin)?;

			// check for overflow
			let app_n: BoundedVec<_, T::MaxAppNameLength> =
				app_name.clone().try_into().map_err(|()| Error::<T>::AppNameLengthOverflow)?;

			let a_cid: BoundedVec<_, T::MaxAppCIDLength> =
				cid.clone().try_into().map_err(|()| Error::<T>::AppCIDOverflow)?;

			let a_perms: BoundedVec<_, T::MaxPermissionsLength> =
				perms.clone().try_into().map_err(|()| Error::<T>::PermissionsLengthOverflow)?;

			// create new ability
			Self::add_ability(&sender, &app_n, &a_cid, &a_perms);

            Self::deposit_event(Event::AppSubmitted(sender, app_name, cid, perms));

			Ok(())
		}

		#[pallet::weight(1000)]
		pub fn verify_app(origin: OriginFor<T>, app_cid: Vec<u8>, verdict: bool) -> DispatchResult
		{
			let sender = T::CustomOrigin::ensure_origin(origin)?;

			// first check cid length
			let cid: BoundedVec<_, T::MaxAppCIDLength> =
				app_cid.clone().try_into().map_err(|()| Error::<T>::AppCIDOverflow)?;

			// first check if this app with the CID exist in memory
			let app = TempPool::<T>::get(&cid).ok_or(<Error<T>>::AppDoesNotExist);

			// now retrieve reviews
			let mut rev = RevBox::<T>::get(&cid).unwrap();

			// make sure there is no duplicate review  **************************
			// for acc in rev.accounts.iter() {
			// 	if *acc == sender {
			// 		// return error
			// 		ensure!(true == false, Error::<T>::DuplicateVoteCast);
			// 	} 
			// }

			// add review
			if verdict == true {
				rev.yays += 1;
			} else {
				rev.nays += 1;
			}

			// add Account id to list
			// rev.accounts.push(user_id);   *******************

			// now check to make final decisions
			if rev.yays + rev.nays == 3 {
				// give verdict
				if rev.yays > rev.nays {
					// add to ability pool, increase revs count

					// insert into ability pool
					// first make sure it hasn't been inserted before
					if let Some(_dummy_app) = AbilityPool::<T>::get(&cid)  {
						// return error
						ensure!(true == false, Error::<T>::AppExistsInPool);
					} else {
						// insert into pool
						AbilityPool::<T>::insert(cid.clone(), app.unwrap());

						// increase total rev count
						match AppsCount::<T>::get() {
							Some(count) => AppsCount::<T>::put(count + 1),
							None => AppsCount::<T>::put(1)
						}
						
						Self::deposit_event(Event::AddedToAbilityPool(cid.to_vec().clone()));
					}
				}

				// remove from temp pool
				// *********************************************

				Self::deposit_event(Event::AppVoteConcluded(cid.to_vec(), rev.nays, rev.yays));
			}

			// Self::deposit_event(Event::RegulatorVoteCasted(sender, verdict));  ***********************
			Self::deposit_event(Event::RegulatorVoteCasted(verdict)); 

			Ok(())
		}
	}

	/// helper functions
	impl<T: Config> Pallet<T> {
		pub fn change_si(user_id: &T::AccountId, ip_address: &BoundedVec<u8, T::MaxIPAddress>) -> u64 {
			let now: u64 = T::TimeProvider::now().as_secs();

			let nsd: SignInDetail<T> = SignInDetail {
				ip: ip_address.clone(),
				time: now
			};

			// update timestamp
			SignIns::<T>::mutate(user_id, |det| {
				*det = Some(nsd);
			});

			now
		}

		pub fn new_si(user_id: &T::AccountId, ip_address: &BoundedVec<u8, T::MaxIPAddress>) -> u64 {
			let now: u64 = T::TimeProvider::now().as_secs();

			let nsd: SignInDetail<T> = SignInDetail {
				ip: ip_address.clone(),
				time: now
			};

			// create new signin record and update timestamp 
			SignIns::<T>::insert(user_id, nsd);

			now
		}

		pub fn update_sam(user_id: &T::AccountId, ps: &BoundedVec<u8, T::MaxPseudoNameLength>, cid: &BoundedVec<u8, T::MaxCIDLength>) {

			let sam: Samaritan<T> = Samaritan {
				pseudoname: ps.clone(),
				cid: cid.clone()
			};

			// update timestamp
			SamPool::<T>::mutate(user_id, |det| {
				*det = Some(sam);
			});

		}

		pub fn new_sam(user_id: &T::AccountId, ps: &BoundedVec<u8, T::MaxPseudoNameLength>, cid: &BoundedVec<u8, T::MaxCIDLength>) {

			let sam: Samaritan<T> = Samaritan {
				pseudoname: ps.clone(),
				cid: cid.clone()
			};

			// create new signin record and update timestamp 
			SamPool::<T>::insert(user_id, sam);

		}

		// upload app for verification in the temporary pool
		pub fn add_ability(user_id: &T::AccountId, name: &BoundedVec<u8, T::MaxAppNameLength>, cid: &BoundedVec<u8, T::MaxAppCIDLength>, perm: &BoundedVec<u8, T::MaxPermissionsLength>) {

			let app: SamApp<T> =  SamApp { name: name.clone(), developer: user_id.clone(), permissions: perm.clone() };

			// insert into temporary pool
			TempPool::<T>::insert(cid.clone(), app);
		}
	}
}
