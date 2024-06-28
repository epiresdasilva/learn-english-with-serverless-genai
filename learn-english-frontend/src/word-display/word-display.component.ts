import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface WordData {
  ingles: string;
  imagePath: string;
  portugues: string;
  portugueseAudioPath: string;
  WordID: number;
  englishAudioPath: string;
}

@Component({
  selector: 'app-word-display',
  templateUrl: './word-display.component.html',
  styleUrls: ['./word-display.component.css']
})
export class WordDisplayComponent implements OnInit {
  wordData: WordData | undefined;
  showEnglish: boolean = true;
  baseUrlAudio: string = 'https://d3vbwaikqawwhe.cloudfront.net/';
  baseUrlImages: string = 'https://d1b88mbugrc94z.cloudfront.net/';
  

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchWordData();
  }

  fetchWordData(): void {
    this.http.get<WordData>('https://un05xoj6i4.execute-api.us-east-1.amazonaws.com/dev/word')
      .subscribe(data => {
        this.wordData = data;
        this.wordData.imagePath = this.baseUrlImages + this.wordData.ingles + ".png";
        this.showEnglish = true; // Reiniciar para inglês ao buscar novas palavras
      });
  }

  playAudio(path: string | undefined): void {
    if (path) {
      const audio = new Audio(this.baseUrlAudio + path);
      audio.play();
    } else {
      console.error('Audio path is undefined');
    }
  }

  toggleLanguage(): void {
    this.showEnglish = !this.showEnglish;
  }
}
