import React from 'react'
import FameSection from './FameSection/FameSection'
import HeroSection from './HeroSection/HeroSection'
import CtaBanner from './CtaBanner/CtaBanner'
import ShowcaseSection from './ShowcaseSection/ShowcaseSection'
import BestSellers from './BestSellers/BestSellers'

const Home = () => {
  return (
    <>
    <HeroSection/> 
    <ShowcaseSection/>
    <BestSellers/>
    <CtaBanner/> 
    <FameSection/>
    
    </>
  )
}

export default Home