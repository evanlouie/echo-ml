import { writeFile } from "fs"
import { ensureDir } from "fs-extra"
import path from "path"
import {
  BaseEntity,
  Column,
  Entity,
  getRepository,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm"
import { promisify } from "util"
import { getPath } from "../lib/electron-helpers"
import { secondsToTime } from "../lib/time"
import { Label } from "./Label"

@Entity()
@Index(["basename", "dirname"], { unique: true })
export class AudioFile extends BaseEntity {
  public static async exportAllLabels() {
    const repository = this.getRepository()
    const audioFiles = await repository.find({
      relations: ["labels", "labels.sampleData"], // Dont include labels.classification. It will be eager loaded from the model
    })
    const writes_ = Promise.all(
      audioFiles
        .map(({ labels, basename }) => {
          return labels.map(async ({ sampleData, classification, startTime }) => {
            const writeOutDir = path.join(getPath("home"), "reverb-export", classification.name)
            await ensureDir(writeOutDir)
            const filename = this.getWriteOutName(basename, classification.name, startTime)
            const writePath = path.join(writeOutDir, filename)
            const buffer = sampleData.blob
            await promisify(writeFile)(writePath, buffer)
            console.log(`Written: ${writePath}`)
            return writePath
          })
        })
        .reduce((flattened, arr) => [...flattened, ...arr]),
    )

    return writes_
  }

  public static async exportLabels(id: number) {
    const audioRepository = getRepository(AudioFile)
    const audioFiles = await audioRepository.find({
      where: { id },
      relations: ["labels", "labels.sampleData"], // Dont include labels.classification. It will be eager loaded from the model
    })
    const writes_ = Promise.all(
      audioFiles
        .map(({ labels, basename }) => {
          return labels.map(async ({ sampleData, classification, startTime }) => {
            const writeOutDir = path.join(getPath("home"), "reverb-export", classification.name)
            await ensureDir(writeOutDir)
            const filename = this.getWriteOutName(basename, classification.name, startTime)
            const writePath = path.join(writeOutDir, filename)
            const buffer = sampleData.blob
            await promisify(writeFile)(writePath, buffer)
            console.log(`Written: ${writePath}`)
          })
        })
        .reduce((flattened, arr) => [...flattened, ...arr]),
    )

    return writes_
  }

  private static getWriteOutName(basename: string, classification: string, startTime: number) {
    return `${basename}_(${classification})_${secondsToTime(startTime)}.wav`
  }

  @PrimaryGeneratedColumn()
  public id!: number

  @Column()
  public basename!: string

  @Column()
  public dirname!: string

  @OneToMany((type) => Label, (label) => label.audioFile)
  public labels!: Label[]

  public async getLabels(): Promise<Label[]> {
    return Label.find({ audioFile: this })
  }
}
