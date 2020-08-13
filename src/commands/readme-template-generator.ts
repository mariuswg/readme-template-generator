import { GluegunCommand } from 'gluegun'

import ExtendedGluegunToolbox from 'src/interfaces/extended-gluegun-toolbox'
import * as Types from 'src/types'

const command: GluegunCommand = {
  name: 'readme-template-generator',
  async run (toolbox: ExtendedGluegunToolbox) {
    const {
      existingFiles,
      itemURL,
      question,
      message,
      generateFile,
      isWebURL,
      showBanner,
      githubRepoInfo,
      filesystem: { read },
      print: { spin }
    } = toolbox

    showBanner({ text: 'Readme|Template Generator' })

    message(
      'warning',
      'Project under development, this is a alpha version!\n' +
      'Contribute: https://github.com/Mikael-R/readme-template-generator\n'
    )

    if (existingFiles('README.md').indexOf('README.md') !== -1) {
      const overwrite: boolean = await question({
        type: 'list',
        message: 'Already exists a README.md file, overwrite it?',
        choices: ['Yes', 'No'],
        customReturn: (value: string) => value === 'Yes'
      })

      if (!overwrite) process.exit(0)
    }

    const packageJson = JSON.parse(read('package.json') || '{}')

    const githubRepoURL: string = await question({
      message: 'Repository URL in GitHub (recommend not skip):',
      defaultValue: githubRepoInfo.url.format(githubRepoInfo.url.inCWD()) || githubRepoInfo.url.format(packageJson.repository?.url),
      validate: (value: string) => {
        if (value === '') return true
        if (!githubRepoInfo.url.test(value)) return 'Invalid GitHub repository URL'
        return true
      },
      customReturn: (value: string) => githubRepoInfo.url.format(value)
    })

    const spinner = githubRepoURL && spin('Getting information about repository')

    const githubRepository = await githubRepoInfo.information(itemURL(githubRepoURL, 2), itemURL(githubRepoURL, 1))

    if (!githubRepository.api.index) {
      spinner?.fail('Repository not found in GitHub API')
    } else {
      spinner?.succeed('Found with success repository information in GitHub API')
    }

    const projectName: string = await question({
      message: 'Project name:',
      defaultValue: githubRepository.name || itemURL(packageJson.repository?.url, 1)?.split('.')[0] || packageJson?.name || itemURL('.', 1)
    })

    const description: string = await question({
      message: 'Write a short description about project:',
      defaultValue: githubRepository.api.index.description || packageJson.description,
      validate: (value: string) => value === '' ? 'Description its necessary' : true
    })

    const badges: Types.Badges = {
      toSelect: [],
      selected: [],
      exists: (badgeName) => badges.selected.indexOf(badgeName) !== -1
    }

    if (githubRepository.url) {
      badges.toSelect.push(
        'Language Most Used',
        'Implementations',
        'Gitpod',
        'Repository Social Status',
        'License',
        'Last Commit',
        'Repository Size'
      )
    }

    if (packageJson.name) {
      badges.toSelect.push('NPM Version', 'NPM Monthly Downloads')
    }

    const herokuUrl: string = await question({
      message: 'Heroku URL (use empty value to skip):',
      validate: (value: string) => {
        if (value === '') return true
        if (!isWebURL(value)) return 'Invalid URL'
        badges.toSelect.push('Heroku')
        return true
      },
      customReturn: (value: string) => value !== '' ? `https://${value}` : value
    })

    const replitUrl: string = await question({
      message: 'Repl.it URL (use empty value to skip):',
      validate: (value: string) => {
        if (value === '') return true
        if (!isWebURL(value)) return 'Invalid URL'
        badges.toSelect.push('Repl.it')
        return true
      },
      customReturn: (value: string) => value !== '' ? `https://${value}.repl.run` : value
    })

    const status: 'development' | 'production' | 'finished' = await question({
      type: 'list',
      message: 'Project status:',
      choices: ['Development', 'Production', 'Finished'],
      customReturn: (value: string) => value.toLowerCase()
    })

    const logo: string = await question({
      message: 'Logo image URL or path (use empty value to skip):',
      validate: (value: string) => {
        if (value === '') return true
        if (!isWebURL(value) && !existingFiles(value).length) return 'Value informed not is URL/Path valid'
        return true
      }
    })

    const images: Types.Images = {
      logo,
      screenshots: []
    }

    while (1) {
      const screenshot: string = await question({
        message: 'GIF/image URL or path for screenshots (use empty value to skip):',
        validate: (value: string) => {
          if (value === '') return true
          if (!isWebURL(value) && !existingFiles(value).length) return 'Value informed not is URL/Path valid'
          return true
        }
      })

      if (!screenshot) break
    }

    const about: string = await question({
      type: 'editor',
      message: 'Write about project (use empty value to skip):'
    })

    const howToUse: string = await question({
      type: 'editor',
      message: 'Inform how to use project:',
      defaultValue: '#### 💻 Desktop\n\n\n\n#### 🌐 Online',
      validate: (value: string) => {
        if (value === '') {
          return 'Information how to use its necessary'
        }
        return true
      }
    })

    const technologies: string[] = []

    while (true) {
      const tech: string = await question({
        message: 'List project technologies (use empty value to skip):'
      })

      if (!tech) break

      technologies.push(tech)
    }

    const features: Types.Features = {
      finished: [],
      pendent: []
    }

    while (true) {
      const finished: string = await question({
        message: 'List project features finished (use empty value to skip):'
      })

      if (!finished) break

      features.finished.push(finished)
    }

    while (true) {
      const pendent: string = await question({
        message: 'List project features pendents (use empty value to skip):'
      })

      if (!pendent) break

      features.pendent.push(pendent)
    }

    const contributeInformation: boolean = githubRepository.url && await question({
      type: 'list',
      message: 'Add tutor how to contribute for this project:',
      choices: ['Yes', 'No'],
      customReturn: (value: string) => value === 'Yes'
    })

    const author: Types.Author = {
      exists: false,
      name: packageJson.author,
      github: githubRepository.author,
      twitter: null,
      website: null,
      linkedin: null
    }

    author.name = await question({
      message: `Author name${!author.name ? ' (use empty value to skip)' : ''}:`,
      defaultValue: author.name
    })

    author.github = await question({
      message: `Author GitHub username${!author.github ? ' (use empty value to skip)' : ''}:`,
      defaultValue: author.github
    })

    author.twitter = await question({
      message: 'Author twitter username (use empty value to skip):',
      validate: (value: string) => {
        if (value !== '') badges.toSelect.push('Author Twitter')
        return true
      }
    })

    author.linkedin = await question({
      message: 'Author LinkedIn username (use empty value to skip):'
    })

    author.website = await question({
      message: 'Author website (use empty value to skip):',
      validate: (value: string) => {
        if (value !== '' && !isWebURL(value)) return 'Invalid URL'
        return true
      }
    })

    if (author.name || author.website || author.twitter || author.github || author.linkedin) author.exists = true

    badges.selected = await question({
      type: 'checkbox',
      message: 'Select badges for use:',
      choices: badges.toSelect,
      customReturn: (value: string[]) =>
        value.map((badge) => badge.toLowerCase().replace(/\s/g, ''))
    })

    /// /////

    const license: Types.License = {
      name: githubRepository.api.index.license.name || read('LICENSE')?.split('\n')[0]?.trim() ||
      packageJson.license,
      url: githubRepository.api.index.license.url || (githubRepository.url && read('LICENSE') && `${githubRepository.url}/blob/master/LICENSE`)
    }

    license.name = await question({
      message: `Project license name${!license.name ? ' (use empty value to skip)' : ''}:`,
      defaultValue: license.name
    })

    license.url = await question({
      message: `Project license URL${!license.name ? ' (use empty value to skip)' : ''}:`,
      defaultValue: license.url,
      validate: (value: string) =>
        license.name && value === '' ? `License URL for ${license.name}` : true
    })

    generateFile({
      template: 'README.md.ejs',
      target: 'README.md',
      props: {
        projectName,
        badges,
        githubRepository,
        herokuUrl,
        replitUrl,
        packageJson,
        status,
        images,
        description,
        about,
        howToUse,
        technologies,
        features,
        contributeInformation,
        author,
        license
      }
    })

    message('success', '\nGenerated README.md file with success in current dir!\n')
  }
}

export default command
