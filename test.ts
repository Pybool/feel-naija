import { IgApiClient } from 'instagram-private-api';
import { get } from 'request-promise';
import Neuron from './src/models/neural.model';

const saveSession = (async(session:any)=>{
    console.log("I was called")
    let neuron:any = await Neuron.findOneAndUpdate({})
    if(!neuron){
        neuron = await new Neuron()
    }
    if(!neuron.igSession){
        neuron.igSession = session
    }
    neuron.igSession = session
    const savedNeuron = await neuron.save()
    console.log("Saved neuron ", savedNeuron)
})

const loadSession = (async()=>{
    let neuron:any = await Neuron.findOneAndUpdate({})
    if(!neuron || !neuron.igSession){
        return null
    }
    return neuron
})

export const postToInsta = async () => {
    const username:any = process.env.INSTAGRAM_USERNAME
    const password:any = process.env.INSTAGRAM_PASSWORD
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    const session:any = await loadSession()
    if (session.igSession) {
        console.log("Using old session", session.igSession)
        await ig.state.deserialize(session.igSession);
    }else{
        console.log("Try to login")
        await ig.account.login(username ,password );
        // This function executes after every request
        const serialized = await ig.state.serialize();
        delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
        await saveSession(serialized);
    }
    const imageBuffer = await get({
        url: 'http://69.49.247.218:8457/uploads/2023-11-22/image_1700655161705.jpeg',
        encoding: null, 
    });

    await ig.publish.photo({
        file: imageBuffer,
        caption: 'Really nice photo from the internet!',
    });
}
