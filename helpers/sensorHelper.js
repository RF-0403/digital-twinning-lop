import getDBPool from "../db/index.js";

const createParameters = (count) => {
  let params = [];
  for (let i = 1; i <= count; i++) params.push(`$${i}`);
  return params.join(",");
};

export const getDataFromDB = async () => {
  const pool = getDBPool();
  let client;
  try {
    client = await pool.connect();
    const fetchQuery =
      "SELECT * FROM public.sensor_data ORDER BY timestamp ASC";
    const { rows } = await client.query(fetchQuery);
    return rows;
  } catch (e) {
    console.log(`Error in inserting to DB: `, e);
  } finally {
    client && client.release();
    pool && pool.end();
  }
};

export const insertDataIntoDB = async (
  client,
  acc_x_latest,
  acc_y_latest,
  acc_z_latest,
  angular_velo_x_latest,
  angular_velo_y_latest,
  angular_velo_z_latest,
  mgm_x,
  mgm_y,
  mgm_z,
  time_interval
) => {
  try {
    // Getting last values from DB
    const getLastValuesQuery = `SELECT * FROM public.sensor_data ORDER BY timestamp DESC LIMIT 1`;
    const { rows } = await client.query(getLastValuesQuery);
    let {
      velo_x,
      velo_y,
      velo_z,
      position_x,
      position_y,
      position_z,
      angular_position_x,
      angular_position_y,
      angular_position_z,
    } = rows[0];
    velo_x = parseFloat(velo_x);
    velo_y = parseFloat(velo_y);
    velo_z = parseFloat(velo_z);
    position_x = parseFloat(position_x);
    position_y = parseFloat(position_y);
    position_z = parseFloat(position_z);
    angular_position_x = parseFloat(angular_position_x);
    angular_position_y = parseFloat(angular_position_y);
    angular_position_z = parseFloat(angular_position_z);
    // Calculating latest linear velocity
    let velo_x_latest = parseFloat(
      (velo_x + time_interval * acc_x_latest).toPrecision(2)
    );
    let velo_y_latest = parseFloat(
      (velo_y + time_interval * acc_y_latest).toPrecision(2)
    );
    let velo_z_latest = parseFloat(
      (velo_z + time_interval * acc_z_latest).toPrecision(2)
    );
    // Calculating latest linear position
    let position_x_latest = parseFloat(
      (
        position_x +
        velo_x * time_interval +
        0.5 * acc_x_latest * time_interval * time_interval
      ).toPrecision(2)
    );
    let position_y_latest = parseFloat(
      (
        position_y +
        velo_y * time_interval +
        0.5 * acc_y_latest * time_interval * time_interval
      ).toPrecision(2)
    );
    let position_z_latest = parseFloat(
      (
        position_z +
        velo_z * time_interval +
        0.5 * acc_z_latest * time_interval * time_interval
      ).toPrecision(2)
    );
    // Calculating latest angular position
    let angular_position_x_latest = parseFloat(
      (angular_position_x + angular_velo_x_latest * time_interval).toPrecision(
        2
      )
    );
    let angular_position_y_latest = parseFloat(
      (angular_position_y + angular_velo_y_latest * time_interval).toPrecision(
        2
      )
    );
    let angular_position_z_latest = parseFloat(
      (angular_position_z + angular_velo_z_latest * time_interval).toPrecision(
        2
      )
    );
    // Columns and values to be inserted
    const columns = [
      "timestamp",
      "acc_x",
      "acc_y",
      "acc_z",
      "velo_x",
      "velo_y",
      "velo_z",
      "position_x",
      "position_y",
      "position_z",
      "angular_velo_x",
      "angular_velo_y",
      "angular_velo_z",
      "angular_position_x",
      "angular_position_y",
      "angular_position_z",
      "mgm_x",
      "mgm_y",
      "mgm_z",
    ];

    values = [
      new Date(),
      acc_x_latest,
      acc_y_latest,
      acc_z_latest,
      velo_x_latest,
      velo_y_latest,
      velo_z_latest,
      position_x_latest,
      position_y_latest,
      position_z_latest,
      angular_velo_x_latest,
      angular_velo_y_latest,
      angular_velo_z_latest,
      angular_position_x_latest,
      angular_position_y_latest,
      angular_position_z_latest,
      mgm_x,
      mgm_y,
      mgm_z,
    ];
    const paramsQuery = createParameters(columns.length);
    const insertQuery = `INSERT INTO public.sensor_data (${[...columns].join(
      ","
    )}) VALUES(${paramsQuery}) ON CONFLICT DO NOTHING`;
    await client.query(insertQuery, values);
  } catch (e) {
    console.log(`Error in inserting to DB: `, e);
  }
};