import md5 from 'md5'
import { CHROMS, chr2Abs } from "./chrom-utils";

export const VCF_URL = "https://aveit.s3.amazonaws.com/misc/sva_elements.sorted.vcf.gz";
export const TBI_URL = "https://aveit.s3.amazonaws.com/misc/sva_elements.sorted.vcf.gz.tbi";

export const vcfRecordToJson = (vcfRecord, chrom) => {
  const info = vcfRecord['INFO'];
  const order = chrom["order"] * 1000000000 + vcfRecord.POS

  return {
    id: md5(order).substring(0,4),
    order: order,
    chrom: vcfRecord.CHROM,
    chromOrder: chrom["order"],
    start: vcfRecord.POS,
    end: info.END[0],
    length: info.SVLEN[0],
    type: info.SVTYPE[0],
    info: info,
    posAbs: chr2Abs(vcfRecord.CHROM, +vcfRecord.POS),
    showDetails: false
  }
}

export const parseLocation = (str) => {
  const chromNames = CHROMS.map(c => c.name);
  if(str.includes(":")){
    const ss = str.split(":").filter(n => n); // remove empty elements
    if(ss.length === 1 && chromNames.includes(ss[0])){
      const chrName = ss[0];
      return {
        posAbs: chr2Abs(chrName,0)
      }
    }
    else if(ss.length > 1 && chromNames.includes(ss[0]) && parseInt(ss[1], 10)){
      const chrName = ss[0];
      const pos = parseInt(ss[1], 10);
      return {
        posAbs: chr2Abs(chrName, pos)
      }
    }
    
  }else if(chromNames.includes(str)){
    return {
      posAbs: chr2Abs(str,0)
    }
  }

  return null
}