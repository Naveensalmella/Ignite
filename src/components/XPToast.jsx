import { useState, useEffect, useRef } from 'react';
import { XP } from '../data';

export default function XPToast({xpEvents}){return xpEvents.map((ev,i)=>(<div key={ev.id} className={`xp-toast ${ev.amount<0?"pen":""}`} style={{top:`${80+i*35}px`}}>{ev.amount>0?"+":""}{ev.amount} XP <span style={{fontSize:13,color:ev.amount>0?"#34d399":"#ef4444",fontWeight:500}}>{ev.reason}</span></div>))}
