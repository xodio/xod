
struct State {
};

typedef struct __attribute__((packed)) _GOST4401_RECORD{
	float	  alt;		// Geopotentional altitude
	float    temp;	    // degrees K
	float  t_grad;		// degrees K per meter
	float	press;		// pascals
} GOST4401_RECORD;

#define GOST4401_LUT_RECORDS 	6
static const GOST4401_RECORD ag_table[] = {
  {	 	0,  288.15, -0.0065, 101325.00 },
  { 11000,  216.65,     0.0,  22632.04 },
  { 20000,  216.65,  0.0010,   5474.87 },
  { 32000,  228.65,  0.0028,  868.0146 },
  { 47000,  270.65,     0.0,  110.9056 },
  { 51000,  270.65, -0.0028,   6.69384 }
};

#define  GOST4401_G		 9.80665
#define  GOST4401_R    287.05287
#define  GOST4401_E      6356766

#define GOST4401_MIN_PRESSURE	  6.69384
#define GOST4401_MAX_PRESSURE   101325.00

#define GOST4401_MIN_GPALT	0.00
#define GOST4401_MAX_GPALT	51000.00

{{ GENERATED_CODE }}



float _GOST4401_geopotential2geometric(float altitude){
	return altitude * GOST4401_E / (GOST4401_E - altitude);
}

void evaluate(Context ctx) {
    auto pressurePa = getValue<input_Pa>(ctx);
    if ((pressurePa <= GOST4401_MIN_PRESSURE) || (pressurePa > GOST4401_MAX_PRESSURE))
        emitValue<output_ERR>(ctx, 1);

    int idx = 0;
    for (idx = 0; idx < GOST4401_LUT_RECORDS - 1; idx++){
        if ((pressurePa <= ag_table[idx].press) && (pressurePa > ag_table[idx + 1].press))
        break;
    }

    float Ps = ag_table[idx].press;
    float Bm = ag_table[idx].t_grad;
    float Tm = ag_table[idx].temp;
    float Hb = ag_table[idx].alt;
    float geopotH = 0;


    if (Bm != 0.0) { 
        geopotH = ((Tm * pow(Ps / pressurePa, Bm * GOST4401_R / GOST4401_G) - Tm) / Bm);
    } else {
        geopotH = log10(Ps / pressurePa) * (GOST4401_R * Tm) / (GOST4401_G * 0.434294);
    }
  
  emitValue<output_ALTT>(ctx, _GOST4401_geopotential2geometric(Hb + geopotH));

}



