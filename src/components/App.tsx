import { Button, Grid, Tooltip, Typography } from "@material-ui/core";
import * as React from "react";
import { selectAudioFiles, selectFiles } from "../lib/electronHelpers";
import { Filesystem } from "../lib/Filesystem";
import { AudioPlayer, IAudioPlayerProps } from "./AudioPlayer";
import { Header } from "./Header";

interface IAppState {
  audioFiles: IAudioPlayerProps[];
}

const player = (props: IAudioPlayerProps) => (
  <Grid item={true} xs={12} key={props.filepath}>
    <Typography variant="title" gutterBottom={true}>
      {props.filepath}
    </Typography>
    <AudioPlayer {...props} />
  </Grid>
);

export class App extends React.PureComponent<any, IAppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      audioFiles: [],
    };
  }

  public selectAudio = async () => {
    const filepaths = await selectAudioFiles();
    const audioFiles = await Promise.all(
      filepaths.map(async (filepath) => {
        const audioBlob = await Filesystem.readFileAsBlob(filepath);
        return {
          audioBlob,
          filepath,
        };
      }),
    );
    this.setState({ audioFiles });
  };

  public render() {
    const { audioFiles } = this.state;
    return (
      <div
        className="App"
        style={{
          height: "100vh",
          width: "100vw",
          display: "grid",
          gridGap: "1em",
          gridTemplateColumns: "2fr 10fr",
          gridTemplateRows: "1fr 11fr",
          gridTemplateAreas: `"header header" "sidebar main"`,
        }}
      >
        <header className="header" style={{ gridArea: "header" }}>
          <Header />
        </header>

        <nav
          className="sidebar"
          style={{ gridArea: "sidebar", borderRight: "1px lightgrey solid" }}
        >
          <Tooltip title="Browse filesystem for valid audio files">
            <Button color="primary" onClick={this.selectAudio} fullWidth={true} size="small">
              Label Audio File
            </Button>
          </Tooltip>
          <Button
            color="secondary"
            onClick={this.selectAudio}
            fullWidth={true}
            size="small"
            disabled={true}
          >
            Classifications
          </Button>
          <Button
            color="secondary"
            onClick={this.selectAudio}
            fullWidth={true}
            size="small"
            disabled={true}
          >
            Labels
          </Button>
        </nav>

        <main className="main" style={{ gridArea: "main", marginRight: "1em" }}>
          {audioFiles.length === 0 ? (
            <Typography variant="body1">Select audio file before to begin labelling</Typography>
          ) : (
            audioFiles.map(player)
          )}
        </main>
      </div>
    );
  }
}