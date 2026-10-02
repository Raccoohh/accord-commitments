export const MAX_SECONDS = 180;
export const MAX_BYTES = 6_000_000;

export function readWav(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii',0,4) !== 'RIFF' || buffer.toString('ascii',8,12) !== 'WAVE') throw new Error('Upload a valid PCM WAV recording.');
  if (buffer.readUInt32LE(4) + 8 !== buffer.length) throw new Error('The WAV file is incomplete or malformed.');
  let format, data;
  for (let offset=12; offset+8<=buffer.length;) {
    const name=buffer.toString('ascii',offset,offset+4), length=buffer.readUInt32LE(offset+4), start=offset+8;
    if (start+length>buffer.length) throw new Error('The audio file is truncated.');
    if(name==='fmt ') {
      if(length<16) throw new Error('Invalid audio format.');
      format={codec:buffer.readUInt16LE(start),channels:buffer.readUInt16LE(start+2),rate:buffer.readUInt32LE(start+4),byteRate:buffer.readUInt32LE(start+8),align:buffer.readUInt16LE(start+12),bits:buffer.readUInt16LE(start+14)};
    }
    if(name==='data') { if(data)throw new Error('Multiple audio data chunks are unsupported.'); data=buffer.subarray(start,start+length); }
    offset=start+length+(length%2);
  }
  if(!format || !data || format.codec!==1 || format.channels!==1 || format.bits!==16 || format.rate!==16000 || format.align!==2 || format.byteRate!==32000 || data.length%2) throw new Error('Audio must be 16 kHz, 16-bit mono PCM WAV. Use the browser uploader to convert your recording.');
  const duration=data.length/32000;
  if(duration<0.5 || duration>MAX_SECONDS) throw new Error('Recordings must be between 0.5 seconds and 3 minutes.');
  let energy=0,peak=0;
  for(let i=0;i<data.length;i+=2){const sample=data.readInt16LE(i)/32768; energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
  return {duration,rms:Math.sqrt(energy/(data.length/2)),peak,data};
}

export function makeWav(pcm,rate=16000) {
  const header=Buffer.alloc(44);
  header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);
  header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);
  header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  return Buffer.concat([header,pcm]);
}
